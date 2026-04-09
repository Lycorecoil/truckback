import { Router, Request, Response, NextFunction } from "express";
import { OrganizationService } from "./organization.service";
import { OrganizationRepository } from "./organization.repository";
import { OrganizationType } from "./organization.entity";

/**
 * Instance unique du repository et du service.
 * Les deux routers (/company et /transporter) partagent le même service.
 */
const repository = new OrganizationRepository();
const service = new OrganizationService(repository);

/**
 * Factory : crée un router Express filtré par type d'organisation.
 * Utilisé dans app.ts :
 *   app.use("/company", createOrganizationRouter("EXPEDITEUR"))
 *   app.use("/transporter", createOrganizationRouter("TRANSPORTER"))
 */
export const createOrganizationRouter = (type: OrganizationType): Router => {
  const router = Router();

  /**
   * GET /company  ou  GET /transporter
   * Liste paginée des organisations du type concerné.
   * Query params : page, limit, sortBy, sortOrder
   */
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;
      const sortBy = (req.query["sortBy"] as string) || "createdAt";
      const sortOrder = (req.query["sortOrder"] as "asc" | "desc") || "desc";

      const result = await service.getByType(type, { page, limit, sortBy, sortOrder });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /company/tenant/:tenantId  ou  GET /transporter/tenant/:tenantId
   * Récupère le profil via le tenantId du JWT Auth Service.
   * IMPORTANT : déclaré AVANT /:id pour éviter le conflit de routes Express.
   */
  router.get("/tenant/:tenantId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getByTenantId(req.params["tenantId"] as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /company/:id  ou  GET /transporter/:id
   * Récupère une organisation par son UUID.
   */
  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getById(req.params["id"] as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /company  ou  POST /transporter
   * Crée une nouvelle organisation.
   * Le type (EXPEDITEUR ou TRANSPORTER) est injecté automatiquement depuis la route.
   */
  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers["x-tenant-id"] as string;
      if (!tenantId) {
        res.status(400).json({ error: "tenantId manquant (token invalide)" });
        return;
      }
      const result = await service.createOne({ ...req.body, type, tenantId });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * PUT /company/:id  ou  PUT /transporter/:id
   * Mise à jour complète du profil (le type ne peut pas être modifié).
   */
  router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // On empêche de changer le type via un PUT
      const { type: _ignored, ...data } = req.body;
      const result = await service.updateOne(req.params["id"] as string, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /company/:id/accept-terms  ou  POST /transporter/:id/accept-terms
   * Enregistre l'acceptation des CGU pour l'organisation.
   * Body : { version: string }  — ex: { "version": "1.0" }
   * Header x-user-id injecté par l'API Gateway (userId du représentant connecté).
   */
  router.post("/:id/accept-terms", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.params["id"] as string;
      const userId = req.headers["x-user-id"] as string;
      const { version } = req.body as { version: string };

      if (!version) {
        res.status(400).json({ error: "Le champ 'version' est requis" });
        return;
      }
      if (!userId) {
        res.status(400).json({ error: "Utilisateur non identifié (token invalide)" });
        return;
      }

      const result = await service.acceptTerms(orgId, userId, version);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /company/:id  ou  DELETE /transporter/:id
   * Soft delete : passe le statut à SUSPENDED sans supprimer le document.
   * Les données sont conservées pour l'historique et la traçabilité.
   */
  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.updateOne(req.params["id"] as string, { statut: "SUSPENDED" });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
