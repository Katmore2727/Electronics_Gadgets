import { ApiError } from '../utils/ApiError.js';
import { USER_ROLES } from '../models/User.js';

/**
 * Restrict access to specific roles
 * Must be used after authenticate middleware
 * @param {...string} allowedRoles - Roles allowed to access (e.g. 'admin', 'customer')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Admin only
 */
export const adminOnly = authorize(USER_ROLES.ADMIN);
