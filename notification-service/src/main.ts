import 'dotenv/config';
import { createApp } from './infrastructure/http/server';
import { connectDatabase } from './infrastructure/db/database';

const PORT = process.env['PORT'] ?? 3005;

const app = createApp();

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[notification-service] Running on port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('[notification-service] Erreur de connexion MongoDB :', err);
    process.exit(1);
  });
