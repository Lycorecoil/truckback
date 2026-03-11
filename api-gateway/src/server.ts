import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { authMiddleware } from './middleware/authMiddleware';
import { createProxyRouter } from './proxy/proxyRouter';
import { getServiceUrls } from './config/services';

export function createApp(): Application {
  const app = express();

  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'];

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
  });

  app.use(authMiddleware);

  const services = getServiceUrls();
  app.use('/', createProxyRouter(services));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
}
