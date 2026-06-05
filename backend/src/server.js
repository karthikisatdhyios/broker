import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/index.js';
import { startScheduler } from './utils/scheduler.js';
import { ensureSeed } from './utils/seed.js';

async function main() {
  await connectDB();

  // Seed demo data automatically when the DB is empty (great for the in-memory demo).
  await ensureSeed();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`\n[server] API listening on http://localhost:${config.port}`);
    console.log(`[server] Demo login: broker1@example.com / password123\n`);
  });

  startScheduler();
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
