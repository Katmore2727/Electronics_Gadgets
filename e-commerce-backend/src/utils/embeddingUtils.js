import * as embeddingService from '../services/embeddingService.js';

/**
 * Generate embedding for product text (name + description + brand)
 * Uses OpenAI embeddings API. Throws ApiError on failure.
 *
 * @param {string} name - Product name
 * @param {string} [description] - Product description
 * @param {string} [brand] - Product brand
 * @returns {Promise<number[]>} - Embedding vector (1536 dims for text-embedding-3-small)
 */
export const generateProductEmbedding = async (name, description = '', brand = '') => {
  return embeddingService.generateProductEmbedding(name, description, brand);
};
