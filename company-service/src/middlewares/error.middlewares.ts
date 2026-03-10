import { Request, Response, NextFunction } from "express";
import { NotFoundError, ConflictError, ValidationError } from "@jb226/generic-service";

/**
 * Middleware de gestion globale des erreurs Express.
 * Doit être déclaré EN DERNIER dans app.ts (après toutes les routes).
 *
 * Il intercepte les erreurs typées du package générique et retourne
 * la bonne réponse HTTP selon le type d'erreur.
 */
export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Erreur 404 : ressource introuvable
  if (err instanceof NotFoundError) {
    res.status(404).json({ success: false, error: err.message, code: 404 });
    return;
  }

  // Erreur 409 : conflit (ex: doublon)
  if (err instanceof ConflictError) {
    res.status(409).json({ success: false, error: err.message, code: 409 });
    return;
  }

  // Erreur 400 : données invalides
  if (err instanceof ValidationError) {
    res.status(400).json({ success: false, error: err.message, code: 400 });
    return;
  }

  // Erreur inconnue : on log et on renvoie 500
  console.error("Erreur interne :", err);
  res.status(500).json({ success: false, error: "Erreur interne du serveur.", code: 500 });
};
