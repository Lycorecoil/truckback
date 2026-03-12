import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './server';
import { registerGracefulShutdown } from './utils/gracefulShutdown';
import { logger } from './utils/logger';

process.env['SERVICE_NAME'] = 'api-gateway';

const PORT = process.env['PORT'] ?? 3006;
const app    = createApp();
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`API Gateway démarré sur le port ${PORT}`);
});

registerGracefulShutdown(server, 'api-gateway');
