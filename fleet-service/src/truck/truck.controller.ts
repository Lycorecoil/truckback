import { Router } from "express";
import { z } from "zod";
import type { TruckService } from "./truck.service";

type Role = "ADMIN" | "TRANSPORTER" | "EXPEDITEUR" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

const TruckCreateSchema = z.object({
  immatriculation: z.string().min(1, "immatriculation est requise"),
  chassis:         z.string().min(1, "chassis est requis"),
  marque:          z.string().min(1, "marque est requise"),
  modele:          z.string().min(1, "modele est requis"),
  typeVehicule:    z.string().min(1, "typeVehicule est requis"),
  carrosserie:     z.string().optional(),
  gabarit:         z.string().optional(),
  capaciteMax:     z.number({ invalid_type_error: "capaciteMax doit être un nombre" }).positive("capaciteMax doit être un nombre positif"),
  photoUrl:        z.string().url().optional(),
  statut:          z.enum(["AVAILABLE", "BUSY", "MAINTENANCE"]).optional(),
  driverId:        z.string().optional(),
  villeBase:       z.string().min(1, "villeBase est requise"),
  paysBase:        z.string().min(1, "paysBase est requis"),
  tenantId:        z.string().optional(),
});

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
      const { truckId, driverId } = req.body as { truckId?: string; driverId?: string };
      if (!truckId || !driverId) {
        res.status(400).json({ error: "truckId et driverId sont requis" });
        return;
      }
      const truck = await service.assignDriver(truckId, driverId);
      res.json(truck);
    } catch (err) {
      next(err);
    }
  });

  // GET /trucks/match?poids=3000&villeDepart=Cotonou&paysDepart=Bénin — TRANSPORTER + ADMIN uniquement
  router.get("/match", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role === "EXPEDITEUR") {
        res.status(403).json({ error: "Les expéditeurs n'ont pas accès à la recherche de camions" });
        return;
      }
      const { poids, typeVehicule, villeDepart, paysDepart } = req.query as Record<string, string>;
      if (!poids || !villeDepart || !paysDepart) {
        res.status(400).json({ error: "poids, villeDepart et paysDepart sont requis" });
        return;
      }
      const poidsNum = parseFloat(poids);
      if (isNaN(poidsNum) || poidsNum <= 0) {
        res.status(400).json({ error: "poids doit être un nombre positif" });
        return;
      }
      const trucks = await service.findMatching({ poids: poidsNum, typeVehicule, villeDepart, paysDepart });
      res.json(trucks);
    } catch (err) {
      next(err);
    }
  });

  // GET /trucks — TRANSPORTER voit uniquement ses propres camions
  router.get("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const tenantId = getHeader(req, "x-tenant-id");

      if (role === "TRANSPORTER") {
        const { available } = req.query as Record<string, string>;
        if (available === "true") {
          res.json(await service.findAvailable(tenantId));
        } else {
          res.json(await service.findByTenantId(tenantId));
        }
        return;
      }

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

      const parsed = TruckCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e: { message: string }) => e.message).join("; ");
        res.status(400).json({ error: messages });
        return;
      }

      const payload = {
        ...parsed.data,
        tenantId: role === "ADMIN" ? (parsed.data.tenantId ?? tenantId) : tenantId,
      };

      const result = await service.createOne(payload as Parameters<typeof service.createOne>[0]);
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
      const body = req.body as Record<string, unknown>;
      if (Object.keys(body).length === 0) {
        res.status(400).json({ error: "Le corps de la requête ne peut pas être vide" });
        return;
      }
      const result = await service.updateOne(req.params["id"] as string, body);
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
