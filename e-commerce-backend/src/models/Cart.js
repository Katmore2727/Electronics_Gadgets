import pool from '../config/database.js';

/**
 * Get or create cart for user
 */
export const getOrCreateCart = async (userId) => {
  let result = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
  if (result.rows[0]) return result.rows[0];

  result = await pool.query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return result.rows[0];
};

/**
 * Get cart items with product details
 */
export const getCartItems = async (cartId) => {
  const result = await pool.query(
    `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.created_at,
            p.name, p.slug, p.price, p.stock_quantity, p.images, p.brand, p.status
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at DESC`,
    [cartId]
  );
  return result.rows;
};

/**
 * Add item to cart (upsert)
 */
export const addItem = async (cartId, productId, quantity) => {
  const result = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()
     RETURNING *`,
    [cartId, productId, quantity]
  );
  return result.rows[0];
};

/**
 * Update cart item quantity
 */
export const updateItemQuantity = async (cartId, productId, quantity) => {
  if (quantity <= 0) {
    return null;
  }
  const result = await pool.query(
    `UPDATE cart_items SET quantity = $3, updated_at = NOW()
     WHERE cart_id = $1 AND product_id = $2
     RETURNING *`,
    [cartId, productId, quantity]
  );
  return result.rows[0];
};

/**
 * Remove item from cart
 */
export const removeItem = async (cartId, productId) => {
  const result = await pool.query(
    'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING id',
    [cartId, productId]
  );
  return result.rows[0];
};

/**
 * Clear all items from cart
 */
export const clearCart = async (cartId) => {
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
};

/**
 * Get cart item by product
 */
export const getCartItem = async (cartId, productId) => {
  const result = await pool.query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cartId, productId]
  );
  return result.rows[0];
};

/**
 * Get cart items with product details (for order creation, with row lock)
 */
export const getCartItemsForOrder = async (client, cartId) => {
  const result = await client.query(
    `SELECT ci.id, ci.product_id, ci.quantity,
            p.id as product_id, p.name, p.price, p.stock_quantity, p.images, p.sku, p.brand, p.status
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1
     FOR UPDATE OF ci`,
    [cartId]
  );
  return result.rows;
};

/**
 * Clear cart items (called within transaction)
 */
export const clearCartItems = async (client, cartId) => {
  await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
};
