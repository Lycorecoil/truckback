import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { RedisClientType } from 'redis';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { createRateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { createAuthMiddleware } from './middleware/authMiddleware';
import { createProxyRouter } from './proxy/proxyRouter';
import { getServiceUrls } from './config/services';
import { metricsMiddleware, metricsHandler } from './utils/metrics.middleware';

export function createApp(redisClient?: RedisClientType): Application {
  const app = express();

  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'];

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(loggerMiddleware);
  app.use(metricsMiddleware);
  app.use(createRateLimitMiddleware(redisClient));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', uptime: Math.floor(process.uptime()) });
  });

  app.get('/metrics', metricsHandler);

  app.use(createAuthMiddleware(redisClient));

  const services = getServiceUrls();
  app.use('/', createProxyRouter(services, redisClient));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
}
