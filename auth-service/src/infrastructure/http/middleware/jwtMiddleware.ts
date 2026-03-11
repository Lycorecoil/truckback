import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../../domain/errors/DomainError';

export interface JWTPayload {
  sub: string;     // userId
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function jwtMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token manquant.'));
  }

  const token = authHeader.slice(7);
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    return next(new Error('JWT_SECRET non configuré.'));
  }

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Token invalide ou expiré.'));
  }
}
