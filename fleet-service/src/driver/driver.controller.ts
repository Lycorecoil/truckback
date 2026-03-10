import { Router } from "express";
import type { DriverService } from "./driver.service";

export function createDriverRouter(service: DriverService): Router {
  const router = Router();

  // GET /fleet/drivers?tenantId=xxx — lister les chauffeurs d'un transporteur
  router.get("/", async (req, res, next) => {
    try {
      const { tenantId } = req.query as Record<string, string>;
      if (tenantId) {
        const drivers = await service.findByTenantId(tenantId);
        res.json(drivers);
        return;
      }
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;
      const result = await service.getAll({ page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // GET /fleet/drivers/:id — détail d'un chauffeur
  router.get("/:id", async (req, res, next) => {
    try {
      const result = await service.getById(req.params["id"] as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // POST /fleet/drivers — créer un chauffeur
  router.post("/", async (req, res, next) => {
    try {
      const result = await service.createOne(req.body as Parameters<typeof service.createOne>[0]);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /fleet/drivers/:id — modifier un chauffeur
  router.put("/:id", async (req, res, next) => {
    try {
      const result = await service.updateOne(req.params["id"] as string, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /fleet/drivers/:id — soft delete (SUSPENDED)
  router.delete("/:id", async (req, res, next) => {
    try {
      const result = await service.updateOne(req.params["id"] as string, { statut: "SUSPENDED" });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
