import * as ProductEmbedding from '../models/ProductEmbedding.js';
import * as embeddingService from './embeddingService.js';
import config from '../config/index.js';

/**
 * Generate and store embedding for a product
 * Skips if OPENAI_API_KEY is not configured
 * @param {Object} product - Product with id, name, description, brand
 */
export const generateAndStoreEmbedding = async (product) => {
  if (!config.openai?.apiKey?.trim()) {
    console.warn('OpenAI API key not set. Skipping product embedding.');
    return;
  }

  try {
    const embedding = await embeddingService.generateProductEmbedding(
      product.name,
      product.description || '',
      product.brand || ''
    );
    await ProductEmbedding.upsert(product.id, embedding);
  } catch (err) {
    console.error(`Failed to generate embedding for product ${product.id}:`, err.message);
    // Don't throw - product creation succeeds; recommendations will be empty for this product
  }
};
