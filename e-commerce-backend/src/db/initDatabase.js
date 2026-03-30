import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if a table exists in the public schema
 */
const tableExists = async (tableName) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0]?.exists ?? false;
  } finally {
    client.release();
  }
};

/**
 * Load and execute schema.sql
 */
const runSchema = async (schemaPath) => {
  const rootDir = join(__dirname, '../..');
  const resolvedPath = join(rootDir, schemaPath);

  let sql;
  try {
    sql = await readFile(resolvedPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Schema file not found: ${resolvedPath}. Set DB_SCHEMA_PATH or add schema/schema.sql`);
    }
    throw err;
  }

  if (!sql.trim()) {
    throw new Error('Schema file is empty');
  }

  const client = await pool.connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
};

/**
 * Initialize database schema if tables don't exist
 * @returns {{ initialized: boolean, message: string }}
 */
export const initDatabase = async () => {
  const { schemaPath, autoInit, checkTable } = config.database;

  if (!autoInit) {
    return { initialized: false, message: 'DB_AUTO_INIT is disabled, skipping schema' };
  }

  try {
    const exists = await tableExists(checkTable);
    if (exists) {
      return { initialized: false, message: `Table '${checkTable}' exists, schema already applied` };
    }

    await runSchema(schemaPath);
    return { initialized: true, message: 'Schema executed successfully' };
  } catch (err) {
    console.error('[Database] Schema initialization failed:', err.message);
    throw err;
  }
};
