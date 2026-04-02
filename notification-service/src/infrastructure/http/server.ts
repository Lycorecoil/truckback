import express, { Application } from 'express';
import mongoose from 'mongoose';
import { notificationRouter } from './router';
import { whatsappQrRouter } from './whatsappQrRouter';
import { errorMiddleware } from './middleware/errorMiddleware';
import { metricsMiddleware, metricsHandler } from '../../utils/metrics.middleware';

export function createApp(): Application {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(metricsMiddleware);

  app.get('/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const status = db === 'connected' ? 'ok' : 'degraded';
    res.status(db === 'connected' ? 200 : 503).json({
      status, service: 'notification-service', db, uptime: Math.floor(process.uptime()),
    });
  });

  app.get('/metrics', metricsHandler);

  // Page QR WhatsApp — sans auth, avant le router protégé
  app.use('/', whatsappQrRouter);

  app.use('/', notificationRouter);

  app.use(errorMiddleware);

  return app;
}
