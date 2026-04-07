import { Router, Request, Response, NextFunction } from "express";
import { CguService } from "./cgu.service";

const service = new CguService();

export const cguRouter = Router();

/** Guard : réserve la route aux admins uniquement */
function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["x-user-role"] !== "ADMIN") {
    res.status(403).json({ error: "Accès réservé aux administrateurs" });
    return;
  }
  next();
}

/**
 * GET /cgu/versions — liste toutes les versions (admin)
 */
cguRouter.get("/versions", adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const versions = await service.getAll();
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /cgu/current — version active (accessible à tous les utilisateurs connectés)
 * Utilisé au login pour connaître la version à comparer avec termsAcceptedVersion.
 */
cguRouter.get("/current", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const active = await service.getActive();
    res.json({ success: true, data: active });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /cgu/compliance — conformité des organisations (admin)
 */
cguRouter.get("/compliance", adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const compliance = await service.getCompliance();
    res.json({ success: true, data: compliance });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /cgu/versions — créer un nouveau brouillon (admin)
 * Body : { version, titre, resume, contenu }
 */
cguRouter.post("/versions", adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version, titre, resume, contenu } = req.body as {
      version: string; titre: string; resume: string; contenu: string;
    };
    if (!version || !titre || !resume || !contenu) {
      res.status(400).json({ error: "Champs requis : version, titre, resume, contenu" });
      return;
    }
    const created = await service.create({ version, titre, resume, contenu });
    res.status(201).json({ success: true, data: created });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "CONFLICT") {
      res.status(409).json({ error: (err as Error).message });
      return;
    }
    next(err);
  }
});

/**
 * PUT /cgu/versions/:id — modifier un brouillon (admin)
 * Body : { titre?, resume?, contenu? }
 */
cguRouter.put("/versions/:id", adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;
    const updated = await service.update(id, req.body as Partial<{ titre: string; resume: string; contenu: string }>);
    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    if ((err as Error).message === "Seuls les brouillons peuvent être modifiés") {
      res.status(422).json({ error: (err as Error).message });
      return;
    }
    next(err);
  }
});

/**
 * POST /cgu/versions/:id/activate — activer une version (admin)
 * Archive la version précédente et force la re-acceptation de toutes les organisations.
 */
cguRouter.post("/versions/:id/activate", adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params["id"] as string;
    const adminId = req.headers["x-user-id"] as string;
    const activated = await service.activate(id, adminId);
    res.json({ success: true, data: activated });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "Version introuvable" || msg.includes("ne peut pas")) {
      res.status(422).json({ error: msg });
      return;
    }
    next(err);
  }
});
