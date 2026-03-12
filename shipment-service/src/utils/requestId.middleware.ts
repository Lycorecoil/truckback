import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './requestContext';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Génère ou propage un X-Request-ID sur chaque requête,
 * puis l'injecte dans l'AsyncLocalStorage pour que tous
 * les appels HTTP inter-services le forwardent automatiquement.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers[REQUEST_ID_HEADER] as string | undefined;
  const requestId = existing ?? randomUUID();
  req.headers[REQUEST_ID_HEADER] = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  requestContext.run({ requestId }, next);
}

export function getRequestId(req: Request): string {
  return (req.headers[REQUEST_ID_HEADER] as string) ?? 'unknown';
}
