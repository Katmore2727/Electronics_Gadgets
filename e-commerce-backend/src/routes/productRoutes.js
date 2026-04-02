import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/roleMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  listProductsQuerySchema,
  recommendationsQuerySchema,
} from '../validators/productValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/categories/list',
  asyncHandler(productController.getCategories)
);

router.get(
  '/brands/list',
  asyncHandler(productController.getBrands)
);

router.get(
  '/',
  validate(listProductsQuerySchema, 'query'),
  asyncHandler(productController.getAll)
);

router.get(
  '/:id/recommendations',
  validate(productIdParamSchema, 'params'),
  validate(recommendationsQuerySchema, 'query'),
  asyncHandler(productController.getRecommendations)
);

router.get(
  '/:id',
  validate(productIdParamSchema, 'params'),
  asyncHandler(productController.getById)
);

router.post(
  '/',
  authenticate,
  adminOnly,
  validate(createProductSchema),
  asyncHandler(productController.create)
);

router.patch(
  '/:id',
  authenticate,
  adminOnly,
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(productController.update)
);

router.put(
  '/:id',
  authenticate,
  adminOnly,
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(productController.update)
);

router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validate(productIdParamSchema, 'params'),
  asyncHandler(productController.remove)
);

export default router;
