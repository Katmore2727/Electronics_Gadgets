import * as ProductEmbedding from '../models/ProductEmbedding.js';
import * as Product from '../models/Product.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';
import { ApiError } from '../utils/ApiError.js';

const DEFAULT_LIMIT = 5;

/**
 * Get similar products by embedding similarity
 * @param {number|string} productId - Current product ID
 * @param {number} [limit=5] - Max number of recommendations
 * @returns {Promise<Object[]>} - Array of similar products
 */
export const getSimilarProducts = async (productId, limit = DEFAULT_LIMIT) => {
  const sourceEmbedding = await ProductEmbedding.findByProductId(productId);
  if (!sourceEmbedding) {
    return [];
  }

  const allEmbeddings = await ProductEmbedding.findAllEmbeddings(productId);
  if (allEmbeddings.length === 0) {
    return [];
  }

  const sourceVec = sourceEmbedding.embedding;
  const scores = allEmbeddings.map((row) => ({
    productId: row.product_id,
    similarity: cosineSimilarity(sourceVec, row.embedding),
  }));

  scores.sort((a, b) => b.similarity - a.similarity);
  const topIds = scores.slice(0, limit).map((s) => Number(s.productId));

  if (topIds.length === 0) return [];

  const products = await Product.findByIds(topIds);
  const scoreMap = Object.fromEntries(scores.slice(0, limit).map((s) => [String(s.productId), s.similarity]));

  return products.map((p) => ({
    ...p,
    similarity: Math.round(scoreMap[String(p.id)] * 1000) / 1000,
  }));
};
