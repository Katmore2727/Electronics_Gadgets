import { ApiError } from '../utils/ApiError.js';
import config from '../config/index.js';

/**
 * Centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  // Joi validation errors (if passed through)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.details?.map((d) => ({ field: d.path.join('.'), message: d.message })) || [],
    });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      field: err.constraint,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
    });
  }

  // Default: 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = config.env === 'production' ? 'Internal server error' : err.message;

  if (config.env !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env !== 'production' && { stack: err.stack }),
  });
};
