import { Router } from "express";
import type { DriverService } from "./driver.service";

type Role = "ADMIN" | "TRANSPORTER" | "COMPANY" | "DRIVER";

function getHeader(req: import("express").Request, name: string): string {
  return (req.headers[name] as string | undefined) ?? "";
}

export function createDriverRouter(service: DriverService): Router {
  const router = Router();

  // GET /fleet/drivers — TRANSPORTER ne voit que ses propres chauffeurs
  router.get("/", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      const tenantId = getHeader(req, "x-tenant-id");

      if (role === "TRANSPORTER") {
        // Isolation : un transporteur ne voit que ses chauffeurs
        res.json(await service.findByTenantId(tenantId));
        return;
      }

      // ADMIN : peut filtrer par tenantId query param ou voir tous
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

      // Pour TRANSPORTER : on force le tenantId depuis le JWT
      const body = {
        ...req.body,
        tenantId: role === "ADMIN" ? (req.body.tenantId ?? tenantId) : tenantId,
      };

      const result = await service.createOne(body as Parameters<typeof service.createOne>[0]);
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
      const result = await service.updateOne(req.params["id"] as string, req.body);
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
