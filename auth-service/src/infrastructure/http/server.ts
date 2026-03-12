import express, { Application } from 'express';
import mongoose from 'mongoose';
import { authRouter } from './router';
import { errorMiddleware } from './middleware/errorMiddleware';
import { requestIdMiddleware } from '../../utils/requestId.middleware';
import { authRateLimiter } from '../../utils/rateLimit.middleware';
import { metricsMiddleware, metricsHandler } from '../../utils/metrics.middleware';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const status = db === 'connected' ? 'ok' : 'degraded';
    res.status(db === 'connected' ? 200 : 503).json({
      status, service: 'auth-service', db, uptime: Math.floor(process.uptime()),
    });
  });

  app.get('/metrics', metricsHandler);

  // Rate limiting strict sur les routes d'authentification
  app.use('/login',   authRateLimiter);
  app.use('/signup',  authRateLimiter);
  app.use('/refresh', authRateLimiter);

  app.use('/', authRouter);
  app.use(errorMiddleware);

  return app;
}
