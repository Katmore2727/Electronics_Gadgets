import pool from '../config/database.js';

export const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, title, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id) DO UPDATE
     SET rating = $3, title = $4, comment = $5, updated_at = NOW()
     RETURNING id, product_id, user_id, rating, title, comment, helpful_count, created_at, updated_at`,
    [data.productId, data.userId, data.rating, data.title || null, data.comment || null]
  );
  return result.rows[0];
};

export const findByProductId = async (productId, limit = 10, offset = 0) => {
  const result = await pool.query(
    `SELECT r.id, r.product_id, r.user_id, r.rating, r.title, r.comment, r.helpful_count, 
            r.created_at, r.updated_at, u.email, u.first_name, u.last_name
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );
  return result.rows;
};

export const findAverageRating = async (productId) => {
  const result = await pool.query(
    `SELECT 
       ROUND(AVG(rating)::numeric, 1) as average_rating,
       COUNT(*)::int as total_reviews,
       SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::int as five_star,
       SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::int as four_star,
       SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::int as three_star,
       SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::int as two_star,
       SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::int as one_star
     FROM reviews
     WHERE product_id = $1`,
    [productId]
  );
  return result.rows[0];
};

export const findByProductAndUser = async (productId, userId) => {
  const result = await pool.query(
    `SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2`,
    [productId, userId]
  );
  return result.rows[0];
};

export const update = async (id, data) => {
  const allowed = ['rating', 'title', 'comment'];
  const fields = [];
  const values = [];
  let paramCount = 1;

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(data[key]);
      paramCount++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE reviews SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

export const remove = async (id) => {
  await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
};
