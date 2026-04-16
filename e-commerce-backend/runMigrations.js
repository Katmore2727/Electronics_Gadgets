import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pool from './src/config/database.js';

/**
 * Run all SQL migration files in order
 */
const runMigrations = async () => {
  const migrationsDir = './migrations';
  const files = [
    '001_auth_schema.sql',
    '002_products_schema.sql',
    '003_cart_and_orders_schema.sql',
    '004_product_embeddings_schema.sql',
    '005_reviews_schema.sql',
    '006_user_admin_assignment.sql',
    '007_order_tracking_enhancement.sql',
  ];

  const client = await pool.connect();

  try {
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`Running migration: ${file}`);
      await client.query(sql);
      console.log(`✅ ${file} completed`);
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
