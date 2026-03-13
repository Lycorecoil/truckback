import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { RedisClientType } from 'redis';

export interface JwtPayload {
  sub: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

const PUBLIC_PATHS = ['/auth/signup', '/auth/login'];

/** Hash d'un token pour la blacklist Redis (évite de stocker le token brut). */
export function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Blackliste un access token dans Redis jusqu'à son expiration naturelle. */
export async function blacklistAccessToken(
  redisClient: RedisClientType,
  token: string,
  payload: JwtPayload,
): Promise<void> {
  const ttl = payload.exp
    ? payload.exp - Math.floor(Date.now() / 1000)
    : 3600;
  if (ttl > 0) {
    await redisClient.set(`blacklist:${tokenHash(token)}`, '1', { EX: ttl });
  }
}

export function createAuthMiddleware(redisClient?: RedisClientType) {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (PUBLIC_PATHS.includes(req.path)) {
      next();
      return;
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

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Vérification blacklist Redis (access tokens révoqués après logout)
    if (redisClient) {
      try {
        const revoked = await redisClient.get(`blacklist:${tokenHash(token)}`);
        if (revoked) {
          res.status(401).json({ error: 'Token révoqué' });
          return;
        }
      } catch {
        // Redis indisponible → fail-open (refresh token reste révoqué côté auth-service)
      }
    }

    req.headers['x-user-id']   = payload.sub;
    req.headers['x-user-role'] = payload.role;
    req.headers['x-tenant-id'] = payload.tenantId;
    next();
  };
}

/** Middleware sans Redis — rétrocompatibilité avec les tests existants. */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void createAuthMiddleware()(req, res, next);
}
