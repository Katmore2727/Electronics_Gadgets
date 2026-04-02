import pool from '../config/database.js';
import * as Product from '../models/Product.js';
import * as ProductEmbedding from '../models/ProductEmbedding.js';
import * as Category from '../models/Category.js';
import { generateProductEmbedding } from '../utils/embeddingUtils.js';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/index.js';

/**
 * Generate URL-friendly slug from string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Ensure unique slug - append suffix if needed
 */
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let suffix = 0;
  let existing = await Product.findBySlug(slug);
  while (existing && existing.id !== excludeId) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
    existing = await Product.findBySlug(slug);
  }
  return slug;
};

/**
 * Create product with AI embedding (admin only)
 * Uses transaction: product + embedding committed together or rolled back on any failure
 */
export const createProduct = async (data) => {
  if (!config.openai?.apiKey?.trim()) {
    throw ApiError.internal(
      'OpenAI API key not configured. Set OPENAI_API_KEY for product embedding generation.'
    );
  }

  const category = await Category.findById(data.categoryId);
  if (!category) {
    throw ApiError.badRequest('Invalid category');
  }

  const existingSku = await Product.findBySku(data.sku);
  if (existingSku) {
    throw ApiError.conflict('Product with this SKU already exists');
  }

  const baseSlug = data.slug || slugify(data.name);
  const slug = await ensureUniqueSlug(baseSlug);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const product = await Product.createWithClient(client, { ...data, slug });

    let embedding;
    try {
      embedding = await generateProductEmbedding(
        product.name,
        product.description || '',
        product.brand || ''
      );
    } catch (err) {
      throw ApiError.internal(
        `Embedding generation failed: ${err.message}. Product was not created.`
      );
    }

    await ProductEmbedding.upsertWithClient(client, product.id, embedding);
    await client.query('COMMIT');

    return product;
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof ApiError) throw err;
    throw ApiError.internal(err.message || 'Product creation failed');
  } finally {
    client.release();
  }
};

/**
 * Update product
 */
export const updateProduct = async (id, data) => {
  const existing = await Product.findById(id);
  if (!existing) {
    throw ApiError.notFound('Product not found');
  }

  if (data.categoryId != null) {
    const category = await Category.findById(data.categoryId);
    if (!category) {
      throw ApiError.badRequest('Invalid category');
    }
  }

  if (data.sku && data.sku !== existing.sku) {
    const duplicateSku = await Product.findBySku(data.sku, id);
    if (duplicateSku) {
      throw ApiError.conflict('Product with this SKU already exists');
    }
  }

  if (data.name && !data.slug) {
    data.slug = await ensureUniqueSlug(slugify(data.name), id);
  } else if (data.slug) {
    data.slug = await ensureUniqueSlug(data.slug, id);
  }

  const updated = await Product.update(id, data);

  if (updated && (data.name || data.description || data.brand) && config.openai?.apiKey?.trim()) {
    try {
      const embedding = await generateProductEmbedding(
        updated.name,
        updated.description || '',
        updated.brand || ''
      );
      await ProductEmbedding.upsert(updated.id, embedding);
    } catch (err) {
      console.error(`[Product] Embedding update failed for ${id}:`, err.message);
    }
  }
  return updated;
};

/**
 * Delete product
 */
export const deleteProduct = async (id) => {
  const deleted = await Product.deleteById(id);
  if (!deleted) {
    throw ApiError.notFound('Product not found');
  }
  return { id: deleted.id };
};

/**
 * Get single product by ID
 */
export const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
};

/**
 * Get all products with pagination, filtering, sorting
 */
export const getAllProducts = async (query) => {
  let categoryId = query.categoryId ? parseInt(query.categoryId, 10) : null;

  if (!categoryId && query.category) {
    const rawCategory = String(query.category).trim();

    if (/^\d+$/.test(rawCategory)) {
      categoryId = parseInt(rawCategory, 10);
    } else {
      const category = await Category.findBySlug(rawCategory);
      categoryId = category?.id ?? null;
    }
  }

  const sortBy = query.sortBy === 'newest' ? 'created_at' : (query.sortBy || 'created_at');
  const sortOrder = query.sortBy === 'newest' ? 'desc' : (query.sortOrder || 'desc');

  const options = {
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? parseInt(query.limit, 10) : 20,
    categoryId,
    status: query.status || null,
    brand: query.brand || null,
    minPrice: query.minPrice != null ? parseFloat(query.minPrice) : null,
    maxPrice: query.maxPrice != null ? parseFloat(query.maxPrice) : null,
    search: query.search?.trim() || null,
    sortBy,
    sortOrder,
  };

  return Product.findAll(options);
};

/**
 * Get all unique brands for filtering
 */
export const getAllBrands = async () => {
  const result = await pool.query(
    `SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND status = 'active' ORDER BY brand ASC`
  );
  return result.rows.map((row) => row.brand);
};
