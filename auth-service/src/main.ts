import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './infrastructure/http/server';
import { connectDatabase } from './infrastructure/db/database';
import { registerGracefulShutdown } from './utils/gracefulShutdown';
import { logger } from './utils/logger';

process.env['SERVICE_NAME'] = 'auth-service';

const PORT = process.env['PORT'] ?? 3000;
const app    = createApp();
const server = createServer(app);

connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Auth Service démarré sur le port ${PORT}`);
    });
    registerGracefulShutdown(server, 'auth-service');
  })
  .catch((err: unknown) => {
    logger.error({ err }, '[auth-service] Erreur de connexion MongoDB');
    process.exit(1);
  });
