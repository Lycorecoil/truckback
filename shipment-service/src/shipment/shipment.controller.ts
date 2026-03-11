import { Router } from "express";
import type { ShipmentService } from "./shipment.service";
import type { ShipmentStatus } from "./shipment.entity";

type Role = "ADMIN" | "COMPANY" | "TRANSPORTER" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

export function createShipmentRouter(service: ShipmentService): Router {
  const router = Router();

  // GET /shipments/search — Chercher camions compatibles (appelle fleet-service)
  // AVANT /:id pour éviter le conflit Express
  router.get("/search", async (req, res, next) => {
    try {
      const { poids, villeDepart, paysDepart, typeVehicule } = req.query as Record<string, string>;
      if (!poids || !villeDepart || !paysDepart) {
        res.status(400).json({ error: "poids, villeDepart et paysDepart sont requis" });
        return;
      }
      const trucks = await service.searchMatchingTrucks({
        poids: parseFloat(poids),
        villeDepart,
        paysDepart,
        typeVehicule,
      });
      res.json(trucks);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/accept — uniquement TRANSPORTER
  router.post("/:id/accept", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut accepter une expédition" });
        return;
      }

      const userId = getHeader(req, "x-user-id");
      const { truckId, driverId } = req.body as { truckId: string; driverId: string };

      // transporterId injecté depuis le JWT, pas depuis le body
      const shipment = await service.acceptShipment(req.params["id"] as string, {
        transporterId: userId,
        truckId,
        driverId,
      });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/start — uniquement DRIVER (ou ADMIN)
  router.post("/:id/start", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "DRIVER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un chauffeur peut démarrer une livraison" });
        return;
      }
      const shipment = await service.startMission(req.params["id"] as string);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/deliver — uniquement DRIVER (ou ADMIN)
  router.post("/:id/deliver", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "DRIVER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un chauffeur peut confirmer une livraison" });
        return;
      }
      const shipment = await service.deliverMission(req.params["id"] as string);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // GET /shipments — COMPANY voit ses propres annonces, TRANSPORTER les siennes
  router.get("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");

      if (role === "COMPANY") {
        // Isolation : une entreprise ne voit que ses propres expéditions
        res.json(await service.findByCompanyId(userId));
        return;
      }

      if (role === "TRANSPORTER") {
        // Un transporteur ne voit que les expéditions qui lui sont assignées
        res.json(await service.findByTransporterId(userId));
        return;
      }

      // ADMIN / DRIVER : peut filtrer par query param ou voir tous
      const { companyId, transporterId, statut } = req.query as Record<string, string>;
      if (companyId) {
        res.json(await service.findByCompanyId(companyId));
        return;
      }
      if (transporterId) {
        res.json(await service.findByTransporterId(transporterId));
        return;
      }
      if (statut) {
        res.json(await service.findByStatut(statut as ShipmentStatus));
        return;
      }
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;
      res.json(await service.getAll({ page, limit }));
    } catch (err) {
      next(err);
    }
  });

  // GET /shipments/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const result = await service.getById(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments — uniquement COMPANY (ou ADMIN)
  router.post("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");

      if (role !== "COMPANY" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul une entreprise peut créer une expédition" });
        return;
      }

      // companyId injecté depuis le JWT, pas depuis le body
      const body = {
        ...req.body,
        companyId: role === "ADMIN" ? (req.body.companyId ?? userId) : userId,
      };

      const result = await service.createOne(
        body as Parameters<typeof service.createOne>[0]
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /shipments/:id — uniquement ADMIN
  router.put("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "ADMIN") {
        res.status(403).json({ error: "Modification directe réservée à l'administrateur" });
        return;
      }
      const result = await service.updateOne(req.params["id"] as string, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /shipments/:id — soft delete (CANCELLED) — COMPANY ou ADMIN
  router.delete("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "COMPANY" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul une entreprise peut annuler une expédition" });
        return;
      }
      const result = await service.cancelShipment(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
