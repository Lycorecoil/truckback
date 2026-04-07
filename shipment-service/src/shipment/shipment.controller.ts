import { Router } from "express";
import { validateBody } from "../utils/validate";
import { CreateShipmentSchema } from "./schemas";
import type { ShipmentService } from "./shipment.service";
import type { ShipmentStatus } from "./shipment.entity";

type Role = "ADMIN" | "EXPEDITEUR" | "TRANSPORTER" | "DRIVER";

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

  // POST /shipments/:id/interest — transporteur manifeste son intérêt
  router.post("/:id/interest", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER") {
        res.status(403).json({ error: "Seul un transporteur peut manifester son intérêt" });
        return;
      }
      const transporterId       = getHeader(req, "x-user-id");
      const transporterTenantId = getHeader(req, "x-tenant-id");
      const { truckId } = req.body as { truckId?: string };
      const shipment = await service.expressInterest(req.params["id"] as string, { transporterId, transporterTenantId, truckId });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /shipments/:id/interest — transporteur annule son intérêt
  router.delete("/:id/interest", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER") {
        res.status(403).json({ error: "Seul un transporteur peut annuler son intérêt" });
        return;
      }
      const transporterId = getHeader(req, "x-user-id");
      const shipment = await service.cancelInterest(req.params["id"] as string, transporterId);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/propose — ADMIN propose la mission à un transporteur
  router.post("/:id/propose", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "ADMIN") {
        res.status(403).json({ error: "Seul l'admin peut proposer une mission" });
        return;
      }
      const { transporterId, transporterTenantId } = req.body as { transporterId?: string; transporterTenantId?: string };
      if (!transporterId) {
        res.status(400).json({ error: "transporterId est requis" });
        return;
      }
      const shipment = await service.proposeToTransporter(req.params["id"] as string, { transporterId, transporterTenantId });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/accept-proposal — transporteur accepte la proposition
  router.post("/:id/accept-proposal", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER") {
        res.status(403).json({ error: "Seul un transporteur peut accepter une proposition" });
        return;
      }
      const transporterId   = getHeader(req, "x-user-id");
      const transporterTenantId = getHeader(req, "x-tenant-id");
      const { truckId, driverId } = req.body as { truckId?: string; driverId?: string };
      if (!truckId || !driverId) {
        res.status(400).json({ error: "truckId et driverId sont requis" });
        return;
      }
      const shipment = await service.acceptProposal(req.params["id"] as string, transporterTenantId, transporterId, { truckId, driverId });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/refuse — transporteur refuse la proposition
  router.post("/:id/refuse", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER") {
        res.status(403).json({ error: "Seul un transporteur peut refuser une proposition" });
        return;
      }
      const transporterTenantId = getHeader(req, "x-tenant-id");
      const shipment = await service.refuseProposal(req.params["id"] as string, transporterTenantId);
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments/:id/accept — uniquement TRANSPORTER (ou ADMIN)
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

      if (role === "EXPEDITEUR") {
        // Expéditions créées par cet expéditeur + expéditions PENDING disponibles
        const [mine, pending] = await Promise.all([
          service.findByCompanyId(userId),
          service.findByStatut("PENDING"),
        ]);
        const ids = new Set((mine as Array<{ id: string }>).map((s) => s.id));
        const all = [...mine, ...(pending as Array<{ id: string }>).filter((s) => !ids.has(s.id))];
        res.json(all);
        return;
      }
      if (role === "TRANSPORTER") {
        const tenantId = getHeader(req, "x-tenant-id");
        const [mine, pending, proposed] = await Promise.all([
          service.findByTransporterId(userId),
          service.findByStatut("PENDING"),
          service.shipmentRepo.findProposedForTransporter(tenantId),
        ]);
        const mineFiltered = (mine as Array<{ id: string; statut: string }>).filter((s) => s.statut !== "PROPOSED");
        const ids = new Set(mineFiltered.map((s) => s.id));
        proposed.forEach((s) => ids.add(s.id));
        const all = [...mineFiltered, ...proposed, ...(pending as Array<{ id: string }>).filter((s) => !ids.has(s.id))];
        res.json(all);
        return;
      }
      if (role === "DRIVER") {
        // Un chauffeur ne voit que les expéditions où il est assigné + PENDING
        const [mine, pending] = await Promise.all([
          service.findByDriverId(userId),
          service.findByStatut("PENDING"),
        ]);
        const ids = new Set((mine as Array<{ id: string }>).map((s) => s.id));
        const all = [...mine, ...(pending as Array<{ id: string }>).filter((s) => !ids.has(s.id))];
        res.json(all);
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

  // GET /shipments/:id — TRANSPORTER (propre ou PENDING) + DRIVER (assigné) + ADMIN
  router.get("/:id", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");

      if (role !== "TRANSPORTER" && role !== "ADMIN" && role !== "DRIVER") {
        res.status(403).json({ error: "Accès refusé à cette expédition" });
        return;
      }

      const result = await service.getById(req.params["id"] as string);

      if (role === "TRANSPORTER") {
        const tenantId = getHeader(req, "x-tenant-id");
        const s = (result as { data?: { transporterId?: string; transporterTenantId?: string; statut?: string } }).data ?? result as { transporterId?: string; transporterTenantId?: string; statut?: string };
        const isOwn        = s.transporterId === userId;
        const isPending    = s.statut === "PENDING";
        const isProposedTo = s.statut === "PROPOSED" && s.transporterTenantId === tenantId;
        if (!isOwn && !isPending && !isProposedTo) {
          res.status(403).json({ error: "Accès refusé à cette expédition" });
          return;
        }
      }

      if (role === "DRIVER") {
        const s = (result as { data?: { driverId?: string } }).data ?? result as { driverId?: string };
        if (s.driverId !== userId) {
          res.status(403).json({ error: "Vous n'êtes pas assigné à cette expédition" });
          return;
        }
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /shipments — uniquement EXPEDITEUR (ou ADMIN)
  router.post("/",
    (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
      const role = (req.headers["x-user-role"] as string | undefined) ?? "";
      if (role !== "EXPEDITEUR" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un expéditeur peut créer une expédition" });
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

  // POST /shipments/:id/cancel — EXPEDITEUR propriétaire ou ADMIN
  router.post("/:id/cancel", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "EXPEDITEUR" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un expéditeur peut annuler une expédition" });
        return;
      }
      if (role === "EXPEDITEUR") {
        const existing = await service.getById(req.params["id"] as string) as { data?: { companyId?: string; statut?: string }; companyId?: string; statut?: string };
        const existingData = existing.data ?? existing;
        if (existingData.companyId !== userId) {
          res.status(403).json({ error: "Vous ne pouvez annuler que vos propres expéditions" });
          return;
        }
        if (!["PENDING", "ACCEPTED"].includes(existingData.statut ?? "")) {
          res.status(400).json({ error: "Cette expédition ne peut plus être annulée" });
          return;
        }
      }
      const { commentaireAnnulation } = req.body as { commentaireAnnulation?: string };
      if (!commentaireAnnulation?.trim()) {
        res.status(400).json({ error: "La raison de l'annulation est obligatoire" });
        return;
      }
      const result = await service.cancelShipment(req.params["id"] as string, commentaireAnnulation.trim());
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /shipments/:id — conservé pour rétrocompatibilité (sans raison)
  router.delete("/:id", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "EXPEDITEUR" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un expéditeur peut annuler une expédition" });
        return;
      }
      if (role === "EXPEDITEUR") {
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
