import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().max(255).optional(),
  comment: Joi.string().max(2000).optional(),
});

const productIdParamSchema = Joi.object({
  productId: Joi.number().required(),
});

const reviewIdParamSchema = Joi.object({
  reviewId: Joi.number().required(),
});

// Get reviews for a product (public)
router.get(
  '/:productId',
  validate(productIdParamSchema, 'params'),
  asyncHandler(reviewController.getProductReviews)
);

// Get user's review for a product (optional auth)
router.get(
  '/:productId/my-review',
  async (req, res, next) => {
    try {
      await reviewController.getMyReview(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Create or update review (authenticated)
router.post(
  '/:productId',
  authenticate,
  validate(productIdParamSchema, 'params'),
  validate(createReviewSchema),
  asyncHandler(reviewController.createReview)
);

// Delete review (authenticated)
router.delete(
  '/:reviewId',
  authenticate,
  validate(reviewIdParamSchema, 'params'),
  asyncHandler(reviewController.deleteReview)
);

export default router;
