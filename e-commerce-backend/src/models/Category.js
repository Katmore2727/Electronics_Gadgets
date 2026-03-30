import pool from '../config/database.js';

export const findById = async (id) => {
  const result = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
  return result.rows[0];
};

export const findAll = async () => {
  const result = await pool.query(
    `SELECT id, name, slug, description, image_url
     FROM categories
     ORDER BY name ASC`
  );
  return result.rows;
};
