import { Router } from "express";
import type { TrackingService } from "./tracking.service";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

export function createTrackingRouter(service: TrackingService): Router {
  const router = Router();

  // POST /tracking — envoyer une position GPS (DRIVER uniquement)
  router.post("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role");
      if (role !== "DRIVER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un chauffeur peut envoyer une position GPS" });
        return;
      }

      const { truckId, shipmentId, latitude, longitude, vitesse } = req.body as {
        truckId?: string;
        shipmentId?: string;
        latitude?: number;
        longitude?: number;
        vitesse?: number;
      };

      if (!truckId || !shipmentId || latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: "truckId, shipmentId, latitude et longitude sont requis" });
        return;
      }

      const point = await service.addPoint({
        truckId,
        shipmentId,
        latitude,
        longitude,
        vitesse,
        timestamp: new Date(),
      });

      res.status(201).json(point);
    } catch (err) {
      next(err);
    }
  });

  // GET /tracking/shipment/:shipmentId — tous les points d'une expédition (tous rôles)
  router.get("/shipment/:shipmentId", async (req, res, next) => {
    try {
      const points = await service.getByShipment(req.params["shipmentId"] as string);
      res.json(points);
    } catch (err) {
      next(err);
    }
  });

  // GET /tracking/truck/:truckId/history — historique complet d'un camion (tous rôles)
  router.get("/truck/:truckId/history", async (req, res, next) => {
    try {
      const history = await service.getHistoryByTruck(req.params["truckId"] as string);
      res.json(history);
    } catch (err) {
      next(err);
    }
  });

  // GET /tracking/truck/:truckId — dernière position connue (tous rôles)
  router.get("/truck/:truckId", async (req, res, next) => {
    try {
      const point = await service.getLatestByTruck(req.params["truckId"] as string);
      if (!point) {
        res.status(404).json({ error: "Aucune position trouvée pour ce camion" });
        return;
      }
      res.json(point);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
