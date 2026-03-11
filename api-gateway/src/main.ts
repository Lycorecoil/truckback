import 'dotenv/config';
import { createApp } from './server';

const PORT = process.env['PORT'] ?? 3006;

const app = createApp();

app.listen(PORT, () => {
  console.log(`[api-gateway] Running on port ${PORT}`);
});
