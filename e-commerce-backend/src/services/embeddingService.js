import OpenAI from 'openai';
import config from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';

let openaiClient = null;

/**
 * Get OpenAI client (lazy init)
 */
const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = config.openai?.apiKey?.trim();
    if (!apiKey) {
      throw ApiError.internal(
        'OpenAI API key not configured. Set OPENAI_API_KEY in environment.'
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
};

/**
 * Generate embedding from text using OpenAI API
 * @param {string} text - Text to embed (e.g. product name + description)
 * @returns {Promise<number[]>} - Embedding vector
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw ApiError.badRequest('Text is required for embedding generation');
  }

  const normalized = text.trim();
  if (!normalized) {
    throw ApiError.badRequest('Text cannot be empty');
  }

  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: config.openai.embeddingModel,
      input: normalized,
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw ApiError.internal('Invalid embedding response from OpenAI');
    }

    return embedding;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.status === 401) {
      throw ApiError.internal('Invalid OpenAI API key');
    }
    if (err.status === 429) {
      throw ApiError.internal('OpenAI rate limit exceeded');
    }
    throw ApiError.internal(
      err.message || 'Failed to generate embedding'
    );
  }
};

/**
 * Generate embedding for product (name + description)
 * @param {string} name - Product name
 * @param {string} [description] - Product description
 * @param {string} [brand] - Product brand
 * @returns {Promise<number[]>} - Embedding vector
 */
export const generateProductEmbedding = async (name, description = '', brand = '') => {
  const parts = [name];
  if (brand) parts.push(brand);
  if (description) parts.push(description);
  const text = parts.join(' ').trim();
  return generateEmbedding(text);
};
