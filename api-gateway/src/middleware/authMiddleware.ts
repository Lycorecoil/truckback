import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

const PUBLIC_PATHS = ['/auth/signup', '/auth/login'];

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (PUBLIC_PATHS.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET not configured' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    req.headers['x-tenant-id'] = payload.tenantId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
