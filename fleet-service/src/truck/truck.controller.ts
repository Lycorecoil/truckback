import { Router } from "express";
import type { TruckService } from "./truck.service";

type Role = "ADMIN" | "TRANSPORTER" | "COMPANY" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

export function createTruckRouter(service: TruckService): Router {
  const router = Router();

  // POST /trucks/assign-driver — AVANT /:id pour éviter le conflit Express
  router.post("/assign-driver", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut assigner un chauffeur" });
        return;
      }
      const { truckId, driverId } = req.body as { truckId: string; driverId: string };
      const truck = await service.assignDriver(truckId, driverId);
      res.json(truck);
    } catch (err) {
      next(err);
    }
  });

  // GET /trucks/match?poids=3000&typeVehicule=BENNE&villeDepart=Cotonou&paysDepart=Bénin
  // Route ouverte (appelée par shipment-service sans JWT utilisateur)
  router.get("/match", async (req, res, next) => {
    try {
      const { poids, typeVehicule, villeDepart, paysDepart } = req.query as Record<string, string>;
      if (!poids || !villeDepart || !paysDepart) {
        res.status(400).json({ error: "poids, villeDepart et paysDepart sont requis" });
        return;
      }
      const trucks = await service.findMatching({
        poids: parseFloat(poids),
        typeVehicule,
        villeDepart,
        paysDepart,
      });
      res.json(trucks);
    } catch (err) {
      next(err);
    }
  });

  // GET /trucks — TRANSPORTER ne voit que ses propres camions
  router.get("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const tenantId = getHeader(req, "x-tenant-id");

      if (role === "TRANSPORTER") {
        // Isolation : un transporteur ne voit que sa propre flotte
        const { available } = req.query as Record<string, string>;
        if (available === "true") {
          res.json(await service.findAvailable(tenantId));
        } else {
          res.json(await service.findByTenantId(tenantId));
        }
        return;
      }

      // ADMIN / COMPANY / DRIVER : peut filtrer par tenantId query param
      const { tenantId: qTenantId, available } = req.query as Record<string, string>;
      if (available === "true" && qTenantId) {
        res.json(await service.findAvailable(qTenantId));
        return;
      }
      if (qTenantId) {
        res.json(await service.findByTenantId(qTenantId));
        return;
      }
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;
      res.json(await service.getAll({ page, limit }));
    } catch (err) {
      next(err);
    }
  });

  // GET /trucks/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const result = await service.getById(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /trucks — uniquement TRANSPORTER (ou ADMIN)
  router.post("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const tenantId = getHeader(req, "x-tenant-id");

      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut créer un camion" });
        return;
      }

      // Pour TRANSPORTER : on force le tenantId depuis le JWT, pas depuis le body
      const body = {
        ...req.body,
        tenantId: role === "ADMIN" ? (req.body.tenantId ?? tenantId) : tenantId,
      };

      const result = await service.createOne(body as Parameters<typeof service.createOne>[0]);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /trucks/:id — uniquement TRANSPORTER (ou ADMIN)
  router.put("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut modifier un camion" });
        return;
      }
      const result = await service.updateOne(req.params["id"] as string, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /trucks/:id — soft delete (MAINTENANCE) — uniquement TRANSPORTER (ou ADMIN)
  router.delete("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut désactiver un camion" });
        return;
      }
      const result = await service.updateOne(req.params["id"] as string, { statut: "MAINTENANCE" });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
