import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JwtPayload;
    }
  }
}

/**
 * Vérifie le JWT sur chaque requête entrante.
 * Défense en profondeur : ne pas faire confiance uniquement au gateway.
 * Attache req.jwtUser et confirme les headers x-user-* injectés par le gateway.
 */
export function jwtVerifyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Les health checks sont toujours publics
  if (req.path === "/health") {
    return next();
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET non configuré" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.jwtUser = payload;
    // Synchronise les headers de confiance avec le token vérifié
    req.headers["x-user-id"]   = payload.sub;
    req.headers["x-user-role"] = payload.role;
    req.headers["x-tenant-id"] = payload.tenantId;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
