import pg from 'pg';
import config from './index.js';

const { Pool } = pg;

/**
 * Build connection config from environment
 * Supports DATABASE_URL or individual credentials
 */
const getPoolConfig = () => {
  const db = config.database;

  if (!db.url && !db.user) {
    throw new Error(
      'Database config required: set DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME'
    );
  }

  if (db.url) {
    return {
      connectionString: db.url,
      max: db.poolSize ?? 20,
      min: db.poolMin ?? 2,
      idleTimeoutMillis: db.idleTimeout ?? 30000,
      connectionTimeoutMillis: db.connectionTimeout ?? 10000,
      allowExitOnIdle: true,
      ...(config.env === 'production' && {
        ssl: db.ssl ? { rejectUnauthorized: true } : false,
      }),
    };
  }

  // Individual credentials fallback
  return {
    host: db.host ?? 'localhost',
    port: db.port ?? 5432,
    user: db.user,
    password: db.password,
    database: db.name,
    max: db.poolSize ?? 20,
    min: db.poolMin ?? 2,
    idleTimeoutMillis: db.idleTimeout ?? 30000,
    connectionTimeoutMillis: db.connectionTimeout ?? 10000,
    allowExitOnIdle: true,
    ...(config.env === 'production' && db.ssl && {
      ssl: { rejectUnauthorized: true },
    }),
  };
};

const pool = new Pool(getPoolConfig());

pool.on('error', (err) => {
  console.error('[Database] Unexpected pool error:', err);
});

/**
 * Test database connection
 */
export const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[Database] Connection test failed:', err.message);
    return false;
  } finally {
    client.release();
  }
};

/**
 * Graceful pool shutdown
 */
export const closePool = async () => {
  try {
    await pool.end();
    console.log('[Database] Pool closed');
  } catch (err) {
    console.error('[Database] Error closing pool:', err);
  }
};

export default pool;
