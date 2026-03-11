import { Router } from "express";
import type { ShipmentService } from "./shipment.service";
import type { ShipmentStatus } from "./shipment.entity";

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

  // Routes d'action — AVANT /:id pour éviter les conflits Express

  // POST /shipments/:id/accept — transporteur accepte la mission
  router.post("/:id/accept", async (req, res, next) => {
    try {
      const { transporterId, truckId, driverId } = req.body as {
        transporterId: string;
        truckId: string;
        driverId: string;
      };
      const shipment = await service.acceptShipment(req.params["id"] as string, {
        transporterId,
        truckId,
        driverId,
      });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/start — chauffeur démarre la livraison
  router.post("/:id/start", async (req, res, next) => {
    try {
      const shipment = await service.startMission(req.params["id"] as string);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/deliver — livraison terminée
  router.post("/:id/deliver", async (req, res, next) => {
    try {
      const shipment = await service.deliverMission(req.params["id"] as string);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // GET /shipments?companyId=&transporterId=&statut=
  router.get("/", async (req, res, next) => {
    try {
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

  // POST /shipments — créer une annonce (statut PENDING par défaut)
  router.post("/", async (req, res, next) => {
    try {
      const result = await service.createOne(
        req.body as Parameters<typeof service.createOne>[0]
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /shipments/:id
  router.put("/:id", async (req, res, next) => {
    try {
      const result = await service.updateOne(req.params["id"] as string, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /shipments/:id — soft delete (CANCELLED) + notifie le transporteur si assigné
  router.delete("/:id", async (req, res, next) => {
    try {
      const result = await service.cancelShipment(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
