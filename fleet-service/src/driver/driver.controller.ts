import { Router } from "express";
import type { DriverService } from "./driver.service";

type Role = "ADMIN" | "TRANSPORTER" | "COMPANY" | "DRIVER";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

function validateDriver(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!body["nom"])                                                   errors.push("nom est requis");
  if (!body["prenom"])                                                errors.push("prenom est requis");
  if (!body["email"] || !EMAIL_REGEX.test(String(body["email"])))    errors.push("email invalide");
  if (!body["telephone"])                                             errors.push("telephone est requis");
  if (!body["numeroPermis"])                                          errors.push("numeroPermis est requis");
  const validStatuts = ["AVAILABLE", "BUSY", "SUSPENDED"];
  if (body["statut"] && !validStatuts.includes(String(body["statut"])))
    errors.push(`statut doit être parmi : ${validStatuts.join(", ")}`);
  return errors;
}

export function createDriverRouter(service: DriverService): Router {
  const router = Router();

  // GET /fleet/drivers — TRANSPORTER voit uniquement ses propres chauffeurs
  router.get("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const tenantId = getHeader(req, "x-tenant-id");

      if (role === "TRANSPORTER") {
        res.json(await service.findByTenantId(tenantId));
        return;
      }

      const { tenantId: qTenantId } = req.query as Record<string, string>;
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

  // GET /fleet/drivers/:id
  router.get("/:id", async (req, res, next) => {
    try {
      const result = await service.getById(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /fleet/drivers — uniquement TRANSPORTER (ou ADMIN)
  router.post("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const tenantId = getHeader(req, "x-tenant-id");

      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut créer un chauffeur" });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const errors = validateDriver(body);
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

  // PUT /fleet/drivers/:id — uniquement TRANSPORTER (ou ADMIN)
  router.put("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut modifier un chauffeur" });
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

  // DELETE /fleet/drivers/:id — soft delete (SUSPENDED) — uniquement TRANSPORTER (ou ADMIN)
  router.delete("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Seul un transporteur peut suspendre un chauffeur" });
        return;
      }
      const result = await service.updateOne(req.params["id"] as string, { statut: "SUSPENDED" });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
