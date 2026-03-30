import pool from '../config/database.js';

const VALID_SORT_FIELDS = ['name', 'price', 'created_at', 'stock_quantity'];
const VALID_SORT_ORDERS = ['asc', 'desc'];

/**
 * Sanitize and build order by clause
 */
const buildOrderBy = (sortBy = 'created_at', sortOrder = 'desc') => {
  const field = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'created_at';
  const order = VALID_SORT_ORDERS.includes(sortOrder?.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
  return { field, order };
};

/**
 * Create product (uses pool)
 */
export const create = async (data) => {
  const result = await pool.query(
    `INSERT INTO products (category_id, name, slug, description, price, compare_at_price, sku, stock_quantity, images, specifications, brand, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.categoryId,
      data.name,
      data.slug,
      data.description ?? null,
      data.price,
      data.compareAtPrice ?? null,
      data.sku,
      data.stockQuantity ?? 0,
      JSON.stringify(data.images ?? []),
      JSON.stringify(data.specifications ?? {}),
      data.brand ?? null,
      data.status ?? 'active',
    ]
  );
  return result.rows[0];
};

/**
 * Create product within transaction (accepts pg client)
 */
export const createWithClient = async (client, data) => {
  const result = await client.query(
    `INSERT INTO products (category_id, name, slug, description, price, compare_at_price, sku, stock_quantity, images, specifications, brand, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.categoryId,
      data.name,
      data.slug,
      data.description ?? null,
      data.price,
      data.compareAtPrice ?? null,
      data.sku,
      data.stockQuantity ?? 0,
      JSON.stringify(data.images ?? []),
      JSON.stringify(data.specifications ?? {}),
      data.brand ?? null,
      data.status ?? 'active',
    ]
  );
  return result.rows[0];
};

/**
 * Update product
 */
export const update = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  const allowed = [
    'categoryId', 'name', 'slug', 'description', 'price', 'compareAtPrice',
    'sku', 'stockQuantity', 'images', 'specifications', 'brand', 'status'
  ];
  const columnMap = {
    categoryId: 'category_id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    price: 'price',
    compareAtPrice: 'compare_at_price',
    sku: 'sku',
    stockQuantity: 'stock_quantity',
    images: 'images',
    specifications: 'specifications',
    brand: 'brand',
    status: 'status',
  };

  for (const key of allowed) {
    if (data[key] !== undefined) {
      const col = columnMap[key];
      if (key === 'images' || key === 'specifications') {
        fields.push(`${col} = $${paramCount}::jsonb`);
        values.push(JSON.stringify(data[key]));
      } else {
        fields.push(`${col} = $${paramCount}`);
        values.push(data[key]);
      }
      paramCount++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete product
 */
export const deleteById = async (id) => {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rows[0];
};

/**
 * Find product by ID (with category name)
 */
export const findById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0];
};

/**
 * Find products by IDs (preserves order of ids)
 */
export const findByIds = async (ids) => {
  if (!ids?.length) return [];
  const result = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ANY($1::bigint[]) AND p.status = 'active'
     ORDER BY array_position($1::bigint[], p.id)`,
    [ids]
  );
  return result.rows;
};

/**
 * Find product by slug
 */
export const findBySlug = async (slug) => {
  const result = await pool.query('SELECT * FROM products WHERE slug = $1', [slug]);
  return result.rows[0];
};

/**
 * Find product by SKU
 */
export const findBySku = async (sku, excludeId = null) => {
  let query = 'SELECT id FROM products WHERE sku = $1';
  const params = [sku];
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  const result = await pool.query(query, params);
  return result.rows[0];
};

/**
 * Get all products with pagination, filtering, sorting
 */
export const findAll = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    categoryId,
    status,
    brand,
    minPrice,
    maxPrice,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  const conditions = [];
  const params = [];
  let paramCount = 1;

  conditions.push('1=1');

  if (categoryId) {
    conditions.push(`p.category_id = $${paramCount}`);
    params.push(categoryId);
    paramCount++;
  }
  if (status) {
    conditions.push(`p.status = $${paramCount}`);
    params.push(status);
    paramCount++;
  }
  if (brand) {
    conditions.push(`p.brand = $${paramCount}`);
    params.push(brand);
    paramCount++;
  }
  if (minPrice != null) {
    conditions.push(`p.price >= $${paramCount}`);
    params.push(minPrice);
    paramCount++;
  }
  if (maxPrice != null) {
    conditions.push(`p.price <= $${paramCount}`);
    params.push(maxPrice);
    paramCount++;
  }
  if (search) {
    conditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.brand ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = conditions.join(' AND ');
  const { field, order } = buildOrderBy(sortBy, sortOrder);
  const offset = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const safeLimit = Math.min(100, Math.max(1, limit));

  params.push(safeLimit, offset);
  const limitParam = paramCount;
  const offsetParam = paramCount + 1;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int as total FROM products p WHERE ${whereClause}`,
    params.slice(0, -2)
  );
  const total = countResult.rows[0].total;

  const result = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE ${whereClause}
     ORDER BY p.${field} ${order}
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    params
  );

  return {
    data: result.rows,
    pagination: {
      page: Math.max(1, page),
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};
