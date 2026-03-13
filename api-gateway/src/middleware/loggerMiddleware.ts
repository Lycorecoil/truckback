import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

export const loggerMiddleware = pinoHttp({
  logger,
  // Évite de logger deux fois les routes /health et /metrics
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/metrics',
  },
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
