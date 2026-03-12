import express, { Application } from 'express';
import { authRouter } from './router';
import { errorMiddleware } from './middleware/errorMiddleware';
import { requestIdMiddleware } from '../../utils/requestId.middleware';
import { authRateLimiter } from '../../utils/rateLimit.middleware';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
  });

  // Rate limiting strict sur les routes d'authentification
  app.use('/login',   authRateLimiter);
  app.use('/signup',  authRateLimiter);
  app.use('/refresh', authRateLimiter);

  app.use('/', authRouter);
  app.use(errorMiddleware);

  return app;
}
