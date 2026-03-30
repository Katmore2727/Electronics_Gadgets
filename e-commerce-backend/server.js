import app from './src/app.js';
import config from './src/config/index.js';
import { testConnection, closePool } from './src/config/database.js';
import { initDatabase } from './src/db/initDatabase.js';

const server = app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port} (${config.env})`);

  try {
    const { initialized, message } = await initDatabase();
    if (initialized) {
      console.log(`[Database] ${message}`);
    } else {
      console.log(`[Database] ${message}`);
    }

    const ok = await testConnection();
    if (!ok) console.warn('[Database] Connection check failed - verify DATABASE_URL');
  } catch (err) {
    console.error('[Database] Startup error:', err.message);
    process.exit(1);
  }
});

const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => {
    closePool().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
