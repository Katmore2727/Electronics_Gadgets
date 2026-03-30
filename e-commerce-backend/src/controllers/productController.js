import * as productService from '../services/productService.js';
import * as recommendationService from '../services/recommendationService.js';
import * as Category from '../models/Category.js';

/**
 * GET /api/products/categories - Get all categories
 */
export const getCategories = async (req, res) => {
  const categories = await Category.findAll();
  res.json({
    success: true,
    data: categories,
  });
};

/**
 * GET /api/products/brands - Get all unique brands
 */
export const getBrands = async (req, res) => {
  const brands = await productService.getAllBrands();
  res.json({
    success: true,
    data: brands,
  });
};

/**
 * GET /api/products - Get all products (pagination, filtering, sorting)
 */
export const getAll = async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

/**
 * GET /api/products/:id/recommendations - Get similar products (AI-based)
 */
export const getRecommendations = async (req, res) => {
  const { id } = req.params;
  const limit = req.query.limit ? Math.min(20, parseInt(req.query.limit, 10)) : 5;
  const products = await recommendationService.getSimilarProducts(id, limit);
  res.json({
    success: true,
    data: products,
  });
};

/**
 * GET /api/products/:id - Get single product by ID
 */
export const getById = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json({
    success: true,
    data: product,
  });
};

/**
 * POST /api/products - Create product (admin only)
 */
export const create = async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
};

/**
 * PATCH /api/products/:id - Update product
 */
export const update = async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
};

/**
 * DELETE /api/products/:id - Delete product
 */
export const remove = async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
};
