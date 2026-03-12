import 'dotenv/config';
import { createServer } from 'http';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { createApp } from './server';
import { registerGracefulShutdown } from './utils/gracefulShutdown';
import { logger } from './utils/logger';

process.env['SERVICE_NAME'] = 'api-gateway';

(async () => {
  let redisClient: RedisClientType | undefined;

  try {
    const redisUrl = process.env['REDIS_URL'] ?? 'redis://redis:6379';
    redisClient = createClient({ url: redisUrl }) as RedisClientType;
    redisClient.on('error', (err) => logger.warn({ err }, '[api-gateway] Redis error'));
    await redisClient.connect();
    logger.info('[api-gateway] Redis connecté — rate limiting partagé actif');
  } catch {
    logger.warn('[api-gateway] Redis indisponible — rate limiting en mémoire locale');
    redisClient = undefined;
  }

  const PORT   = process.env['PORT'] ?? 3006;
  const app    = createApp(redisClient);
  const server = createServer(app);

  server.listen(PORT, () => {
    logger.info(`API Gateway démarré sur le port ${PORT}`);
  });

  registerGracefulShutdown(server, 'api-gateway');
})();
