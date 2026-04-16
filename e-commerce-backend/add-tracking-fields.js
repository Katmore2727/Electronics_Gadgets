import 'dotenv/config';
import pool from './src/config/database.js';

const runMigration = async () => {
  const client = await pool.connect();

  try {
    console.log('Running order tracking enhancement migration...');

    await client.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;
    `);

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

runMigration().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});