import * as Review from '../models/Review.js';
import * as Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * GET /api/reviews/:productId - Get reviews for a product
 */
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const limit = req.query.limit ? Math.min(20, parseInt(req.query.limit, 10)) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const [reviews, ratingData] = await Promise.all([
    Review.findByProductId(productId, limit, offset),
    Review.findAverageRating(productId),
  ]);

  res.json({
    success: true,
    data: reviews,
    rating: ratingData || {
      average_rating: 0,
      total_reviews: 0,
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0,
    },
  });
};

/**
 * POST /api/reviews/:productId - Create or update a review
 */
export const createReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;
  const userId = req.user.id;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    throw ApiError.badRequest('Rating must be between 1 and 5');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Create or update review
  const review = await Review.create({
    productId,
    userId,
    rating: Math.round(rating),
    title: title?.trim() || null,
    comment: comment?.trim() || null,
  });

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review,
  });
};

/**
 * DELETE /api/reviews/:reviewId - Delete a review
 */
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  // Check if review exists and belongs to user
  const result = await pool.query(
    'SELECT user_id FROM reviews WHERE id = $1',
    [reviewId]
  );

  if (result.rows.length === 0) {
    throw ApiError.notFound('Review not found');
  }

  if (result.rows[0].user_id !== userId) {
    throw ApiError.forbidden('You can only delete your own reviews');
  }

  await Review.remove(reviewId);

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
};

/**
 * GET /api/reviews/:productId/my-review - Get user's review for a product
 */
export const getMyReview = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.json({
      success: true,
      data: null,
    });
  }

  const review = await Review.findByProductAndUser(productId, userId);

  res.json({
    success: true,
    data: review || null,
  });
};
