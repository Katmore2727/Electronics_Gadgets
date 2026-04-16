import 'dotenv/config';
import pool from './src/config/database.js';

const migrateExistingOrders = async () => {
  const client = await pool.connect();

  try {
    console.log('Migrating existing orders to add status history...');

    // Get all orders
    const ordersResult = await client.query('SELECT id, status, created_at, updated_at FROM orders');
    const orders = ordersResult.rows;

    for (const order of orders) {
      // Create status history based on current status
      const statusHistory = [];

      // Always add 'placed' status
      statusHistory.push({
        status: 'placed',
        timestamp: order.created_at.toISOString()
      });

      // Add current status if it's not 'placed' and different from created_at
      if (order.status !== 'placed' && order.status !== 'pending') {
        statusHistory.push({
          status: order.status,
          timestamp: order.updated_at.toISOString()
        });
      }

      // Update the order with status history
      await client.query(
        'UPDATE orders SET status_history = $1 WHERE id = $2',
        [JSON.stringify(statusHistory), order.id]
      );

      console.log(`✅ Migrated order ${order.id}`);
    }

    console.log(`✅ Migrated ${orders.length} orders successfully!`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrateExistingOrders().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});