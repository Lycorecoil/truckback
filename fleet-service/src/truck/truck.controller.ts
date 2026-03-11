import { Router } from "express";
import type { TruckService } from "./truck.service";

type Role = "ADMIN" | "TRANSPORTER" | "COMPANY" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

/** Retourne une liste d'erreurs de validation ou [] si tout est OK */
function validateTruck(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body["immatriculation"])           errors.push("immatriculation est requise");
  if (!body["marque"])                    errors.push("marque est requise");
  if (!body["modele"])                    errors.push("modele est requis");
  if (!body["typeVehicule"])              errors.push("typeVehicule est requis");
  if (!body["villeBase"])                 errors.push("villeBase est requise");
  if (!body["paysBase"])                  errors.push("paysBase est requis");
  const cap = Number(body["capaciteMax"]);
  if (!body["capaciteMax"] || isNaN(cap) || cap <= 0)
    errors.push("capaciteMax doit être un nombre positif");
  const validStatuts = ["AVAILABLE", "BUSY", "MAINTENANCE"];
  if (body["statut"] && !validStatuts.includes(String(body["statut"])))
    errors.push(`statut doit être parmi : ${validStatuts.join(", ")}`);
  return errors;
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

  // GET /trucks/match?poids=3000&villeDepart=Cotonou&paysDepart=Bénin
  router.get("/match", async (req, res, next) => {
    try {
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

      const body = req.body as Record<string, unknown>;
      const errors = validateTruck(body);
      if (errors.length > 0) {
        res.status(400).json({ error: errors.join("; ") });
        return;
      }

      const payload = {
        ...body,
        tenantId: role === "ADMIN" ? (body["tenantId"] ?? tenantId) : tenantId,
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
