import pool from '../config/database.js';

const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
};

/**
 * User model - handles database operations for users
 */
export const create = async ({ email, passwordHash, firstName, lastName, role = USER_ROLES.CUSTOMER }) => {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, first_name, last_name, role, is_verified, created_at, updated_at`,
    [email, passwordHash, firstName, lastName, role]
  );
  return result.rows[0];
};

export const findByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, phone, avatar_url, is_verified, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const findByIdWithPassword = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const saveRefreshToken = async (userId, tokenHash, expiresAt) => {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
};

export const findRefreshToken = async (userId, tokenHash) => {
  const result = await pool.query(
    `SELECT * FROM refresh_tokens 
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()`,
    [userId, tokenHash]
  );
  return result.rows[0];
};

export const deleteRefreshToken = async (userId, tokenHash) => {
  await pool.query(
    'DELETE FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2',
    [userId, tokenHash]
  );
};

export const deleteAllUserRefreshTokens = async (userId) => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};

export const deleteExpiredRefreshTokens = async () => {
  await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
};

export { USER_ROLES };
