import { Server } from "http";
import { logger } from "./logger";

/**
 * Graceful shutdown pour l'api-gateway (pas de MongoDB).
 * - Stoppe l'acceptation de nouvelles connexions
 * - Laisse les requêtes en cours se terminer (timeout 10s)
 */
export function registerGracefulShutdown(server: Server, serviceName: string): void {
  const shutdown = (signal: string) => () => {
    logger.info({ signal }, `[${serviceName}] Signal reçu, arrêt propre...`);

    server.close(() => {
      logger.info(`[${serviceName}] Serveur HTTP fermé`);
      process.exit(0);
    });

    setTimeout(() => {
      logger.error(`[${serviceName}] Timeout graceful shutdown — arrêt forcé`);
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT",  shutdown("SIGINT"));
}
