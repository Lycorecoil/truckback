import { randomBytes }  from "crypto";
import { Router }       from "express";
import type { DriverService } from "./driver.service";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { logger }           from "../utils/logger";

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from(randomBytes(10)).map(b => chars[b % chars.length]).join('');
}

type Role = "ADMIN" | "TRANSPORTER" | "EXPEDITEUR" | "DRIVER";

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
  const validStatuts = ["AVAILABLE", "BUSY", "SUSPENDED", "DELETED"];
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
        res.json(await service.findByTenantId(tenantId, true));
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

  // GET /fleet/drivers/me — DRIVER voit son propre profil
  router.get("/me", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "DRIVER") {
        res.status(403).json({ error: "Réservé aux chauffeurs" });
        return;
      }
      const result = await service.getById(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /fleet/drivers/me — DRIVER met à jour son propre téléphone
  router.put("/me", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "DRIVER") {
        res.status(403).json({ error: "Réservé aux chauffeurs" });
        return;
      }
      const { telephone } = req.body as { telephone?: string };
      if (!telephone) {
        res.status(400).json({ error: "telephone est requis" });
        return;
      }
      const result = await service.updateOne(userId, { telephone });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // PUT /fleet/drivers/me/device-token — DRIVER enregistre son OneSignal player ID
  router.put("/me/device-token", async (req, res, next) => {
    try {
      const role   = getHeader(req, "x-user-role") as Role;
      const userId = getHeader(req, "x-user-id");
      if (role !== "DRIVER") {
        res.status(403).json({ error: "Réservé aux chauffeurs" });
        return;
      }
      const { oneSignalPlayerId } = req.body as { oneSignalPlayerId?: string };
      if (!oneSignalPlayerId) {
        res.status(400).json({ error: "oneSignalPlayerId est requis" });
        return;
      }
      const result = await service.updateOne(userId, { oneSignalPlayerId });
      res.json(result);
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

      // Fire-and-forget : création du compte auth DRIVER
      // POST /auth/drivers gère la création + notifications (email + WhatsApp) en interne
      const tempPassword  = generateTempPassword();
      const authorization = req.headers['authorization'] ?? '';
      setImmediate(() => {
        void (async () => {
          try {
            const authUrl = process.env['AUTH_SERVICE_URL'] ?? 'http://auth-service:3000';
            const authRes = await fetchWithTimeout(`${authUrl}/drivers`, {
              method:  'POST',
              headers: {
                'Content-Type':  'application/json',
                'Authorization': authorization,
              },
              body: JSON.stringify({
                email:        body['email'],
                password:     tempPassword,
                tenantId:     payload['tenantId'],
                telephone:    body['telephone'],
                nom:          body['nom'],
                prenom:       body['prenom'],
                numeroPermis: body['numeroPermis'],
              }),
            }, 8_000);

            if (!authRes.ok) {
              const err = await authRes.json().catch(() => ({}));
              logger.warn({ status: authRes.status, err, email: body['email'] }, '[fleet-service] Compte auth chauffeur non créé');
            } else {
              logger.info({ email: body['email'] }, '[fleet-service] Compte auth + credentials chauffeur créés');
            }
          } catch (authErr) {
            logger.warn({ authErr }, '[fleet-service] Erreur appel auth-service pour le chauffeur');
          }
        })();
      });
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

  // DELETE /fleet/drivers/:id
  // TRANSPORTER → SUSPENDED (visible côté transporteur avec badge orange)
  // ADMIN       → DELETED   (disparaît de la vue transporteur, visible admin uniquement)
  router.delete("/:id", async (req, res, next) => {
    try {
      const role = getHeader(req, "x-user-role") as Role;
      if (role !== "TRANSPORTER" && role !== "ADMIN") {
        res.status(403).json({ error: "Action non autorisée" });
        return;
      }
      const newStatut = role === "ADMIN" ? "DELETED" : "SUSPENDED";
      const result = await service.updateOne(req.params["id"] as string, { statut: newStatut });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
