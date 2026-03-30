import pool from '../config/database.js';

const DEFAULT_MODEL = 'text-embedding-3-small';

/**
 * Save or upsert product embedding (uses pool)
 */
export const upsert = async (productId, embedding, modelVersion = DEFAULT_MODEL) => {
  const embeddingStr = `[${embedding.join(',')}]`;
  await pool.query(
    `INSERT INTO product_embeddings (product_id, embedding, model_version)
     VALUES ($1, $2::double precision[], $3)
     ON CONFLICT (product_id, model_version)
     DO UPDATE SET embedding = EXCLUDED.embedding, created_at = NOW()`,
    [productId, embeddingStr, modelVersion]
  );
};

/**
 * Save or upsert product embedding within transaction (accepts pg client)
 */
export const upsertWithClient = async (client, productId, embedding, modelVersion = DEFAULT_MODEL) => {
  const embeddingStr = `[${embedding.join(',')}]`;
  await client.query(
    `INSERT INTO product_embeddings (product_id, embedding, model_version)
     VALUES ($1, $2::double precision[], $3)
     ON CONFLICT (product_id, model_version)
     DO UPDATE SET embedding = EXCLUDED.embedding, created_at = NOW()`,
    [productId, embeddingStr, modelVersion]
  );
};

/**
 * Get embedding for product
 */
export const findByProductId = async (productId, modelVersion = DEFAULT_MODEL) => {
  const result = await pool.query(
    'SELECT embedding FROM product_embeddings WHERE product_id = $1 AND model_version = $2',
    [productId, modelVersion]
  );
  return result.rows[0];
};

/**
 * Get all product embeddings (product_id, embedding) for similarity search
 */
export const findAllEmbeddings = async (excludeProductId = null, modelVersion = DEFAULT_MODEL) => {
  let query = `
    SELECT pe.product_id, pe.embedding
    FROM product_embeddings pe
    JOIN products p ON pe.product_id = p.id
    WHERE pe.model_version = $1 AND p.status = 'active'
  `;
  const params = [modelVersion];
  if (excludeProductId) {
    params.push(excludeProductId);
    query += ` AND pe.product_id != $${params.length}`;
  }
  const result = await pool.query(query, params);
  return result.rows;
};
