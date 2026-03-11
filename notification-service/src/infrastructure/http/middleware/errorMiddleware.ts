import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors/NotificationError';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error('[notification-service]', err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
}
