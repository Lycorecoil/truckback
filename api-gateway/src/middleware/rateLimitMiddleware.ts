import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
  max: parseInt(process.env['RATE_LIMIT_MAX'] ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
