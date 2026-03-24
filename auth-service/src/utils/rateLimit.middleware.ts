import rateLimit from "express-rate-limit";

/** Rate limiter par défaut pour les services internes (moins strict que le gateway). */
export const internalRateLimiter = rateLimit({
  windowMs: 60_000,   // 1 minute
  max: 300,           // 300 req/min par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez dans une minute." },
});

/** Rate limiter strict pour les endpoints d'authentification. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: parseInt(process.env['AUTH_RATE_LIMIT_MAX'] ?? '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion, réessayez dans 15 minutes." },
});
