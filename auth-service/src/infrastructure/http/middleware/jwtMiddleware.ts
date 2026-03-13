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
  const rawPublicKey = process.env['JWT_PUBLIC_KEY'];
  if (!rawPublicKey) {
    return next(new Error('JWT_PUBLIC_KEY non configuré.'));
  }
  const publicKey = rawPublicKey.replace(/\\n/g, '\n');

  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Token invalide ou expiré.'));
  }
}
