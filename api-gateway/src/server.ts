import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { RedisClientType } from 'redis';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { createRateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { createAuthMiddleware } from './middleware/authMiddleware';
import { createProxyRouter } from './proxy/proxyRouter';
import { getServiceUrls } from './config/services';
import { metricsMiddleware, metricsHandler } from './utils/metrics.middleware';
import { openApiSpec } from './openapi';

export function createApp(redisClient?: RedisClientType): Application {
  const app = express();

  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:3000'];

  app.use(helmet({
    // Swagger UI requiert des inline scripts — désactivé uniquement sur /v1/docs
    contentSecurityPolicy: false,
  }));
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(loggerMiddleware);
  app.use(metricsMiddleware);
  app.use(createRateLimitMiddleware(redisClient));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', uptime: Math.floor(process.uptime()) });
  });

  app.get('/metrics', metricsHandler);

  // Documentation OpenAPI — accessible sans JWT
  app.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'Camion Uber API',
    swaggerOptions: { persistAuthorization: true },
  }));

  app.use(createAuthMiddleware(redisClient));

  const services = getServiceUrls();
  app.use('/', createProxyRouter(services, redisClient));

  app.use((_req, res) => {
    res.status(404).json({ success: false, code: 404, error: 'Route not found' });
  });

  return app;
}
