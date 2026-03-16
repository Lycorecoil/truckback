import { Router } from "express";
import { validateBody } from "../utils/validate";
import { CreateShipmentSchema } from "./schemas";
import type { ShipmentService } from "./shipment.service";
import type { ShipmentStatus } from "./shipment.entity";

type Role = "ADMIN" | "COMPANY" | "TRANSPORTER" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

export function createShipmentRouter(service: ShipmentService): Router {
  const router = Router();

  // GET /shipments/search — AVANT /:id pour éviter le conflit Express
  router.get("/search", async (req, res, next) => {
    try {
      const { poids, villeDepart, paysDepart, typeVehicule } = req.query as Record<string, string>;
      if (!poids || !villeDepart || !paysDepart) {
        res.status(400).json({ error: "poids, villeDepart et paysDepart sont requis" });
        return;
      }
      const poidsNum = parseFloat(poids);
      if (isNaN(poidsNum) || poidsNum <= 0) {
        res.status(400).json({ error: "poids doit être un nombre positif" });
        return;
      }
      const trucks = await service.searchMatchingTrucks({ poids: poidsNum, villeDepart, paysDepart, typeVehicule });
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
      const transporterTenantId = getHeader(req, "x-tenant-id");
      const { truckId, driverId } = req.body as { truckId?: string; driverId?: string };
      if (!truckId || !driverId) {
        res.status(400).json({ error: "truckId et driverId sont requis" });
        return;
      }
      const shipment = await service.acceptShipment(req.params["id"] as string, {
        transporterId: userId,
        transporterTenantId,
        truckId,
        driverId,
      });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/start — uniquement DRIVER assigné (ou ADMIN)
  router.post("/:id/start", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "DRIVER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un chauffeur peut démarrer une livraison" });
        return;
      }
      if (role === "DRIVER") {
        const existing = await service.getById(req.params["id"] as string) as { data?: { driverId?: string }; driverId?: string };
        const existingData = existing.data ?? existing;
        if (existingData.driverId !== userId) {
          res.status(403).json({ error: "Vous n'êtes pas assigné à cette expédition" });
          return;
        }
      }
      const shipment = await service.startMission(req.params["id"] as string);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/deliver — uniquement DRIVER assigné (ou ADMIN)
  router.post("/:id/deliver", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "DRIVER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un chauffeur peut confirmer une livraison" });
        return;
      }
      if (role === "DRIVER") {
        const existing = await service.getById(req.params["id"] as string) as { data?: { driverId?: string }; driverId?: string };
        const existingData = existing.data ?? existing;
        if (existingData.driverId !== userId) {
          res.status(403).json({ error: "Vous n'êtes pas assigné à cette expédition" });
          return;
        }
      }
      const shipment = await service.deliverMission(req.params["id"] as string);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // GET /shipments — isolation automatique par rôle
  router.get("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");

      if (role === "COMPANY") {
        res.json(await service.findByCompanyId(userId));
        return;
      }
      if (role === "TRANSPORTER") {
        // Expéditions déjà acceptées par ce transporteur + expéditions PENDING disponibles
        const [mine, pending] = await Promise.all([
          service.findByTransporterId(userId),
          service.findByStatut("PENDING"),
        ]);
        const ids = new Set((mine as Array<{ id: string }>).map((s) => s.id));
        const all = [...mine, ...(pending as Array<{ id: string }>).filter((s) => !ids.has(s.id))];
        res.json(all);
        return;
      }
      if (role === "DRIVER") {
        // Un chauffeur ne voit que les expéditions où il est assigné
        res.json(await service.findByDriverId(userId));
        return;
      }

      // ADMIN : accès complet avec filtres optionnels
      const { companyId, transporterId, driverId, statut } = req.query as Record<string, string>;
      if (companyId)    { res.json(await service.findByCompanyId(companyId)); return; }
      if (transporterId){ res.json(await service.findByTransporterId(transporterId)); return; }
      if (driverId)     { res.json(await service.findByDriverId(driverId)); return; }
      if (statut)       { res.json(await service.findByStatut(statut as ShipmentStatus)); return; }

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
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      const result = await service.getById(req.params["id"] as string);

      if (role !== "ADMIN") {
        const s = (result as { data?: { companyId?: string; transporterId?: string; driverId?: string } }).data ?? result as { companyId?: string; transporterId?: string; driverId?: string };
        const hasAccess =
          s.companyId     === userId ||
          s.transporterId === userId ||
          s.driverId      === userId;
        if (!hasAccess) {
          res.status(403).json({ error: "Accès refusé à cette expédition" });
          return;
        }
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments — uniquement COMPANY (ou ADMIN)
  router.post("/",
    (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
      const role = (req.headers["x-user-role"] as string | undefined) ?? "";
      if (role !== "COMPANY" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul une entreprise peut créer une expédition" });
        return;
      }
      next();
    },
    validateBody(CreateShipmentSchema),
    async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");

      const body = req.body as Record<string, unknown>;

      const tenantId = getHeader(req, "x-tenant-id");
      const payload = {
        ...body,
        companyId: role === "ADMIN" ? (body["companyId"] ?? userId) : userId,
        companyTenantId: role === "ADMIN" ? (body["companyTenantId"] as string | undefined ?? tenantId) : tenantId,
      };

      const result = await service.createOne(payload as Parameters<typeof service.createOne>[0]);
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

  // DELETE /shipments/:id — soft delete (CANCELLED) — COMPANY propriétaire ou ADMIN
  router.delete("/:id", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "COMPANY" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul une entreprise peut annuler une expédition" });
        return;
      }
      if (role === "COMPANY") {
        const existing = await service.getById(req.params["id"] as string) as { data?: { companyId?: string }; companyId?: string };
        const existingData = existing.data ?? existing;
        if (existingData.companyId !== userId) {
          res.status(403).json({ error: "Vous ne pouvez annuler que vos propres expéditions" });
          return;
        }
      }
      const result = await service.cancelShipment(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
