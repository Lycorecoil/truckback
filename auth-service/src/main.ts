import 'dotenv/config';
import { createApp } from './infrastructure/http/server';
import { connectDatabase } from './infrastructure/db/database';

const PORT = process.env['PORT'] ?? 3000;

const app = createApp();

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[auth-service] Running on port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error('[auth-service] Erreur de connexion MongoDB :', err);
    process.exit(1);
  });
