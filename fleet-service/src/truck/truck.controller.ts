import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { join } from "path";
import { mkdirSync } from "fs";
import type { TruckService } from "./truck.service";

const UPLOAD_DIR = process.env["UPLOAD_DIR"] ?? "/app/uploads/trucks";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const truckId = req.params["id"] as string;
    const dir = join(UPLOAD_DIR, truckId);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${file.fieldname}.jpg`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

type Role = "ADMIN" | "TRANSPORTER" | "EXPEDITEUR" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

const TruckCreateSchema = z.object({
  immatriculation: z.string({ required_error: "immatriculation est requise" }).min(1, "immatriculation est requise"),
  chassis:         z.string({ required_error: "chassis est requis" }).min(1, "chassis est requis"),
  marque:          z.string({ required_error: "marque est requise" }).min(1, "marque est requise"),
  modele:          z.string({ required_error: "modele est requis" }).min(1, "modele est requis"),
  typeVehicule:    z.string({ required_error: "typeVehicule est requis" }).min(1, "typeVehicule est requis"),
  carrosserie:     z.string().optional(),
  gabarit:         z.string().optional(),
  capaciteMax:     z.number({ required_error: "capaciteMax est requis", invalid_type_error: "capaciteMax doit être un nombre" }).positive("capaciteMax doit être un nombre positif"),
  photos:          z.object({
    gauche: z.string().optional(),
    droite: z.string().optional(),
    avant:  z.string().optional(),
  }).optional(),
  statut:          z.enum(["AVAILABLE", "BUSY", "MAINTENANCE"]).optional(),
  driverId:        z.string().optional(),
  villeBase:       z.string({ required_error: "villeBase est requise" }).min(1, "villeBase est requise"),
  paysBase:        z.string({ required_error: "paysBase est requis" }).min(1, "paysBase est requis"),
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
      try {
        const truck = await service.assignDriver(truckId, driverId);
        res.json(truck);
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        res.status(e.statusCode ?? 400).json({ error: e.message ?? "Erreur d'assignation" });
      }
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

      const truckId = req.params["id"] as string;

      // Si le body contient driverId, passer par la validation métier
      if ("driverId" in body) {
        const { driverId, ...rest } = body;

        // Mise à jour des autres champs d'abord (si présents)
        if (Object.keys(rest).length > 0) {
          await service.updateOne(truckId, rest);
        }

        // Assignation avec validation
        if (driverId) {
          try {
            const result = await service.assignDriver(truckId, driverId as string);
            res.json(result);
          } catch (err: unknown) {
            const e = err as { statusCode?: number; message?: string };
            res.status(e.statusCode ?? 400).json({ error: e.message ?? "Erreur d'assignation" });
          }
        } else {
          // driverId null/undefined → désassigner
          try {
            const result = await service.unassignDriver(truckId);
            res.json(result);
          } catch (err: unknown) {
            const e = err as { statusCode?: number; message?: string };
            res.status(e.statusCode ?? 400).json({ error: e.message ?? "Erreur de désassignation" });
          }
        }
        return;
      }

      const result = await service.updateOne(truckId, body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /trucks/:id/photos — upload des photos (multer multipart)
  router.post(
    "/:id/photos",
    upload.fields([
      { name: "gauche", maxCount: 1 },
      { name: "droite", maxCount: 1 },
      { name: "avant",  maxCount: 1 },
    ]),
    async (req, res, next) => {
      try {
        const role = getHeader(req, "x-user-role") as Role;
        if (role !== "TRANSPORTER" && role !== "ADMIN") {
          res.status(403).json({ success: false, code: 403, error: "Accès refusé" });
          return;
        }
        const truckId  = req.params["id"] as string;
        const tenantId = getHeader(req, "x-tenant-id");

        const truck = await service.getById(truckId) as unknown as import("./truck.entity").Truck | null;
        if (!truck) {
          res.status(404).json({ success: false, code: 404, error: "Camion introuvable" });
          return;
        }
        if (role !== "ADMIN" && truck.tenantId !== tenantId) {
          res.status(403).json({ success: false, code: 403, error: "Accès refusé" });
          return;
        }

        const files = req.files as Record<string, Express.Multer.File[]>;
        const photos: { gauche?: string; droite?: string; avant?: string } = { ...(truck.photos ?? {}) };

        for (const side of ["gauche", "droite", "avant"] as const) {
          if (files[side]?.[0]) {
            photos[side] = `/uploads/trucks/${truckId}/${side}.jpg`;
          }
        }

        const updated = await service.updateOne(truckId, { photos });
        res.json(updated);
      } catch (err) {
        next(err);
      }
    }
  );

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
