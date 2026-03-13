import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { RedisClientType } from 'redis';
import jwt from 'jsonwebtoken';
import { ServiceUrls } from '../config/services';
import { requireRoles } from '../middleware/rbacMiddleware';
import { blacklistAccessToken, type JwtPayload } from '../middleware/authMiddleware';

export function createProxyRouter(services: ServiceUrls, redisClient?: RedisClientType): Router {
  const router = Router();

  const proxy = (target: string, pathPrefix: string) =>
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${pathPrefix}`]: '' },
      on: {
        error: (err, _req, res) => {
          console.error(`[api-gateway] Proxy error → ${target}:`, (err as Error).message);
          const httpRes = res as import('http').ServerResponse;
          httpRes.writeHead(502, { 'Content-Type': 'application/json' });
          httpRes.end(JSON.stringify({ error: 'Service unavailable' }));
        },
      },
    });

  // Intercept POST /auth/logout — blackliste l'access token dans Redis avant de proxifier
  router.post('/auth/logout', async (req: Request, _res: Response, next: NextFunction) => {
    if (redisClient) {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const secret = process.env['JWT_SECRET'];
      if (token && secret) {
        try {
          const payload = jwt.verify(token, secret) as JwtPayload;
          await blacklistAccessToken(redisClient, token, payload);
        } catch {
          // token déjà expiré — pas besoin de blacklister
        }
      }
    }
    next();
  });

  // Auth — public pour signup/login, restreint pour le reste
  router.use('/auth', proxy(services.auth, '/auth'));

  // Company — tous les rôles authentifiés
  router.use('/company', requireRoles('ADMIN', 'COMPANY', 'TRANSPORTER', 'DRIVER'), proxy(services.company, '/company'));

  // Fleet — TRANSPORTER gère sa flotte, COMPANY et DRIVER peuvent consulter
  router.use('/fleet', requireRoles('ADMIN', 'TRANSPORTER', 'COMPANY', 'DRIVER'), proxy(services.fleet, '/fleet'));

  // Shipment — COMPANY crée/annule, TRANSPORTER accepte, DRIVER démarre/livre
  router.use('/shipments', requireRoles('ADMIN', 'COMPANY', 'TRANSPORTER', 'DRIVER'), proxy(services.shipment, '/shipments'));

  // Notification — tous les rôles authentifiés
  router.use('/notification', requireRoles('ADMIN', 'COMPANY', 'TRANSPORTER', 'DRIVER'), proxy(services.notification, '/notification'));

  // Tracking — DRIVER envoie, COMPANY/TRANSPORTER/ADMIN consulte
  router.use('/tracking', requireRoles('ADMIN', 'COMPANY', 'TRANSPORTER', 'DRIVER'), proxy(services.tracking, '/tracking'));

  return router;
}
