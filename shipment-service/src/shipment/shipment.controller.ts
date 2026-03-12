import { Router } from "express";
import type { ShipmentService } from "./shipment.service";
import type { ShipmentStatus } from "./shipment.entity";

type Role = "ADMIN" | "COMPANY" | "TRANSPORTER" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

function validateShipment(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body["marchandise"])       errors.push("marchandise est requise");
  if (!body["villeDepart"])       errors.push("villeDepart est requise");
  if (!body["paysDepart"])        errors.push("paysDepart est requis");
  if (!body["villeArrivee"])      errors.push("villeArrivee est requise");
  if (!body["paysArrivee"])       errors.push("paysArrivee est requis");
  if (!body["dateAnnonce"])       errors.push("dateAnnonce est requise");
  if (!body["heureAnnonce"])      errors.push("heureAnnonce est requise (format HH:MM)");
  const poids = Number(body["poids"]);
  if (!body["poids"] || isNaN(poids) || poids <= 0)
    errors.push("poids doit être un nombre positif");
  const quantite = Number(body["quantite"]);
  if (!body["quantite"] || isNaN(quantite) || quantite <= 0)
    errors.push("quantite doit être un nombre positif");
  return errors;
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
        res.json(await service.findByTransporterId(userId));
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

      const body = req.body as Record<string, unknown>;
      const errors = validateShipment(body);
      if (errors.length > 0) {
        res.status(400).json({ error: errors.join("; ") });
        return;
      }

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
