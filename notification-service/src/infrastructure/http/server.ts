import express, { Application } from 'express';
import { notificationRouter } from './router';
import { errorMiddleware } from './middleware/errorMiddleware';

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'notification-service' });
  });

  app.use('/', notificationRouter);

  app.use(errorMiddleware);

  return app;
}
