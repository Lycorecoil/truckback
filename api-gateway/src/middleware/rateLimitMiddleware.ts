import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisClientType } from 'redis';

export function createRateLimitMiddleware(redisClient?: RedisClientType): RateLimitRequestHandler {
  const options: Parameters<typeof rateLimit>[0] = {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
    max:      parseInt(process.env['RATE_LIMIT_MAX']        ?? '100',   10),
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests, please try again later.' },
  };

  if (redisClient) {
    options.store = new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });
  }

  return rateLimit(options);
}
