import { Server } from "http";
import mongoose from "mongoose";
import { logger } from "./logger";

/**
 * Enregistre les handlers SIGTERM/SIGINT pour un arrêt propre.
 * - Stoppe l'acceptation de nouvelles connexions
 * - Laisse les requêtes en cours se terminer (timeout 10s)
 * - Ferme la connexion MongoDB
 */
export function registerGracefulShutdown(server: Server, serviceName: string): void {
  const shutdown = (signal: string) => async () => {
    logger.info({ signal }, `[${serviceName}] Signal reçu, arrêt propre...`);

    server.close(async () => {
      logger.info(`[${serviceName}] Serveur HTTP fermé`);
      try {
        await mongoose.connection.close();
        logger.info(`[${serviceName}] Connexion MongoDB fermée`);
        process.exit(0);
      } catch (err) {
        logger.error({ err }, `[${serviceName}] Erreur fermeture MongoDB`);
        process.exit(1);
      }
    });

    // Force l'arrêt si les connexions ne se ferment pas en 10 secondes
    setTimeout(() => {
      logger.error(`[${serviceName}] Timeout graceful shutdown — arrêt forcé`);
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT",  shutdown("SIGINT"));
}
