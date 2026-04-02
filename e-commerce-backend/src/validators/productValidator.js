import Joi from 'joi';

const productStatus = Joi.string().valid('active', 'draft', 'archived');

export const createProductSchema = Joi.object({
  categoryId: Joi.number().integer().positive().required().messages({
    'number.base': 'Category ID must be a number',
  }),
  name: Joi.string().min(2).max(255).required().trim(),
  slug: Joi.string().max(280).optional().trim(),
  description: Joi.string().max(5000).optional().trim().allow(''),
  price: Joi.number().positive().required(),
  compareAtPrice: Joi.number().positive().optional().allow(null),
  sku: Joi.string().max(80).required().trim(),
  stockQuantity: Joi.number().integer().min(0).optional().default(0),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
  specifications: Joi.object().optional().default({}),
  brand: Joi.string().max(100).optional().trim().allow('', null),
  status: productStatus.optional().default('active'),
});

export const updateProductSchema = Joi.object({
  categoryId: Joi.number().integer().positive().optional(),
  name: Joi.string().min(2).max(255).optional().trim(),
  slug: Joi.string().max(280).optional().trim(),
  description: Joi.string().max(5000).optional().trim().allow(''),
  price: Joi.number().positive().optional(),
  compareAtPrice: Joi.number().positive().optional().allow(null),
  sku: Joi.string().max(80).optional().trim(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  specifications: Joi.object().optional(),
  brand: Joi.string().max(100).optional().trim().allow('', null),
  status: productStatus.optional(),
}).min(1);

export const productIdParamSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Product ID must be a positive integer',
  }),
});

export const recommendationsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20).optional(),
});

export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  category: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().max(120).trim()
  ).optional(),
  status: productStatus.optional(),
  brand: Joi.string().max(100).optional().trim(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  search: Joi.string().max(200).optional().trim(),
  sortBy: Joi.string().valid('name', 'price', 'created_at', 'stock_quantity', 'newest').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});
