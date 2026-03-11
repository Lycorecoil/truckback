import { Request, Response, NextFunction } from 'express';
import { DomainError, UnauthorizedError } from '../../../domain/errors/DomainError';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error('[auth-service]', err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
