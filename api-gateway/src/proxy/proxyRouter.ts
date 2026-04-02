import { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { RedisClientType } from 'redis';
import jwt from 'jsonwebtoken';
import { ServiceUrls } from '../config/services';
import { requireRoles } from '../middleware/rbacMiddleware';
import { blacklistAccessToken, type JwtPayload } from '../middleware/authMiddleware';

export function createProxyRouter(services: ServiceUrls, redisClient?: RedisClientType): Router {
  const router = Router();

  // Express strip le préfixe matchant avant de passer au proxy (ex: /v1/shipments → /).
  // servicePrefix permet de remettre le préfixe attendu par le service cible (ex: /shipments).
  const proxy = (target: string, servicePrefix = '') =>
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ...(servicePrefix ? { pathRewrite: (path: string) => servicePrefix + path } : {}),
      on: {
        error: (err, _req, res) => {
          const httpRes = res as import('http').ServerResponse;
          httpRes.writeHead(502, { 'Content-Type': 'application/json' });
          httpRes.end(JSON.stringify({ success: false, code: 502, error: 'Service unavailable' }));
        },
      },
    });

  // Intercept POST /v1/auth/logout — blackliste l'access token dans Redis avant de proxifier
  router.post('/v1/auth/logout', async (req: Request, _res: Response, next: NextFunction) => {
    if (redisClient) {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const rawPublicKey = process.env['JWT_PUBLIC_KEY'];
      const publicKey = rawPublicKey?.replace(/\\n/g, '\n');
      if (token && publicKey) {
        try {
          const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
          await blacklistAccessToken(redisClient, token, payload);
        } catch {
          // token déjà expiré — pas besoin de blacklister
        }
      }
    }
    next();
  });

  // Auth — public pour signup/login, restreint pour le reste
  router.use('/v1/auth', proxy(services.auth));

  // Company — tous les rôles authentifiés
  router.use('/v1/company', requireRoles('ADMIN', 'EXPEDITEUR', 'TRANSPORTER', 'DRIVER'), proxy(services.company));

  // Fleet — TRANSPORTER gère sa flotte, EXPEDITEUR et DRIVER peuvent consulter
  router.use('/v1/fleet', requireRoles('ADMIN', 'TRANSPORTER', 'EXPEDITEUR', 'DRIVER'), proxy(services.fleet));

  // Shipment — EXPEDITEUR crée/annule, TRANSPORTER accepte, DRIVER démarre/livre
  router.use('/v1/shipments', requireRoles('ADMIN', 'EXPEDITEUR', 'TRANSPORTER', 'DRIVER'), proxy(services.shipment, '/shipments'));

  // Notification — tous les rôles authentifiés
  router.use('/v1/notification', requireRoles('ADMIN', 'EXPEDITEUR', 'TRANSPORTER', 'DRIVER'), proxy(services.notification));

  // Tracking — DRIVER envoie, EXPEDITEUR/TRANSPORTER/ADMIN consulte
  router.use('/v1/tracking', requireRoles('ADMIN', 'EXPEDITEUR', 'TRANSPORTER', 'DRIVER'), proxy(services.tracking, '/tracking'));

  return router;
}
