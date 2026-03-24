import rateLimit from "express-rate-limit";

/** Rate limiter par défaut pour les services internes (moins strict que le gateway). */
export const internalRateLimiter = rateLimit({
  windowMs: 60_000,   // 1 minute
  max: parseInt(process.env["INTERNAL_RATE_LIMIT_MAX"] ?? "300", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez dans une minute." },
});

/** Rate limiter strict pour les endpoints d'authentification. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  max: 20,               // 20 tentatives max
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion, réessayez dans 15 minutes." },
});
