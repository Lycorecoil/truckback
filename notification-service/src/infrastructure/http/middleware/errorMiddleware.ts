import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors/NotificationError';
import { logger } from '../../../utils/logger';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainError) {
    res.status(400).json({ success: false, code: 400, error: err.message });
    return;
  }

  logger.error({ err }, '[notification-service] Erreur interne');
  res.status(500).json({ success: false, code: 500, error: 'Erreur interne du serveur.' });
}
