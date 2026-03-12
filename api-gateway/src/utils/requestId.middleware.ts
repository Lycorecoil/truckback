import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const REQUEST_ID_HEADER = "x-request-id";

/** Génère ou propage un X-Request-ID sur chaque requête. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers[REQUEST_ID_HEADER] as string | undefined;
  const requestId = existing ?? randomUUID();
  req.headers[REQUEST_ID_HEADER] = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

/** Retourne le requestId de la requête courante. */
export function getRequestId(req: Request): string {
  return (req.headers[REQUEST_ID_HEADER] as string) ?? "unknown";
}
