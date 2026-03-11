import express, { Application } from 'express';
import { authRouter } from './router';
import { errorMiddleware } from './middleware/errorMiddleware';

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
  });

  app.use('/', authRouter);

  app.use(errorMiddleware);

  return app;
}
