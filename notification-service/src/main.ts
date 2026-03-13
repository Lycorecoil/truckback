import './tracing';
import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './infrastructure/http/server';
import { connectDatabase } from './infrastructure/db/database';
import { registerGracefulShutdown } from './utils/gracefulShutdown';
import { logger } from './utils/logger';
// Démarre les workers BullMQ (email + SMS avec retry automatique)
import './infrastructure/queue/notificationWorker';

process.env['SERVICE_NAME'] = 'notification-service';

const PORT   = process.env['PORT'] ?? 3005;
const app    = createApp();
const server = createServer(app);

connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Notification Service démarré sur le port ${PORT}`);
    });
    registerGracefulShutdown(server, 'notification-service');
  })
  .catch((err: unknown) => {
    logger.error({ err }, '[notification-service] Erreur de connexion MongoDB');
    process.exit(1);
  });
