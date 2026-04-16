import pool from '../config/database.js';

/**
 * Generate unique order number
 */
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Create order (called within transaction)
 */
export const createOrder = async (client, data) => {
  const paymentStatus = data.paymentMethod === 'cod' ? 'pending' : 'paid';
  const billingAddress = {
    ...data.billingAddress,
    paymentMethod: data.paymentMethod,
  };

  // Calculate estimated delivery date (3-7 days from now)
  const now = new Date();
  const estimatedDeliveryDate = new Date(now);
  estimatedDeliveryDate.setDate(now.getDate() + Math.floor(Math.random() * 5) + 3); // 3-7 days

  // Initial status history
  const initialStatusHistory = [{
    status: 'placed',
    timestamp: now.toISOString()
  }];

  const result = await client.query(
    `INSERT INTO orders (user_id, order_number, status, subtotal, tax, shipping_cost, total, payment_status, shipping_address, billing_address, notes, status_history, estimated_delivery_date)
     VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.userId,
      data.orderNumber,
      data.subtotal,
      data.tax,
      data.shippingCost,
      data.total,
      paymentStatus,
      JSON.stringify(data.shippingAddress),
      JSON.stringify(billingAddress),
      data.notes ?? null,
      JSON.stringify(initialStatusHistory),
      estimatedDeliveryDate,
    ]
  );
  return result.rows[0];
};

/**
 * Create order item (called within transaction)
 */
export const createOrderItem = async (client, data) => {
  await client.query(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.orderId,
      data.productId,
      data.quantity,
      data.unitPrice,
      data.totalPrice,
      JSON.stringify(data.productSnapshot),
    ]
  );
};

/**
 * Deduct product stock (called within transaction)
 * Returns true if stock was deducted, false if insufficient stock
 */
export const deductStock = async (client, productId, quantity) => {
  const result = await client.query(
    `UPDATE products SET stock_quantity = stock_quantity - $2, updated_at = NOW()
     WHERE id = $1 AND stock_quantity >= $2`,
    [productId, quantity]
  );
  return result.rowCount > 0;
};

/**
 * Find order by ID with items
 */
export const findById = async (id) => {
  const orderResult = await pool.query(
    'SELECT * FROM orders WHERE id = $1',
    [id]
  );
  if (!orderResult.rows[0]) return null;

  const itemsResult = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
    [id]
  );

  return {
    ...orderResult.rows[0],
    items: itemsResult.rows,
  };
};

/**
 * Find orders by user ID (paginated)
 */
export const findByUserId = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int as total
     FROM orders
     WHERE user_id = $1
       AND status <> 'cancelled'`,
    [userId]
  );
  const total = countResult.rows[0].total;

  const result = await pool.query(
    `SELECT o.*,
            first_item.product_snapshot AS lead_item,
            items.item_count
     FROM orders o
     LEFT JOIN LATERAL (
       SELECT oi.product_snapshot
       FROM order_items oi
       WHERE oi.order_id = o.id
       ORDER BY oi.id
       LIMIT 1
     ) first_item ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS item_count
       FROM order_items oi
       WHERE oi.order_id = o.id
     ) items ON TRUE
     WHERE o.user_id = $1
       AND o.status <> 'cancelled'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Find all orders for admin (paginated) - filtered by assigned users
 */
export const findAll = async (adminId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int as total
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE u.assigned_admin_id = $1`,
    [adminId]
  );
  const total = countResult.rows[0].total;

  const result = await pool.query(
    `SELECT o.*,
            u.first_name,
            u.last_name,
            u.email,
            first_item.product_snapshot AS lead_item,
            items.item_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN LATERAL (
       SELECT oi.product_snapshot
       FROM order_items oi
       WHERE oi.order_id = o.id
       ORDER BY oi.id
       LIMIT 1
     ) first_item ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS item_count
       FROM order_items oi
       WHERE oi.order_id = o.id
     ) items ON TRUE
     WHERE u.assigned_admin_id = $1
     ORDER BY o.created_at DESC
     LIMIT $2 OFFSET $3`,
    [adminId, limit, offset]
  );

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update order status
 */
export const updateStatus = async (id, status) => {
  const now = new Date();
  const result = await pool.query(
    `UPDATE orders
     SET status = $2,
         status_history = status_history || $3::jsonb,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, JSON.stringify([{ status, timestamp: now.toISOString() }])]
  );
  return result.rows[0];
};

export const updateStatusAndNotes = async (id, status, notes, paymentStatus = null) => {
  const now = new Date();
  const result = await pool.query(
    `UPDATE orders
     SET status = $2,
         notes = $3,
         payment_status = COALESCE($4, payment_status),
         status_history = status_history || $5::jsonb,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status, notes, paymentStatus, JSON.stringify([{ status, timestamp: now.toISOString() }])]
  );
  return result.rows[0];
};
