import jwt from 'jsonwebtoken';
import * as User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/index.js';

/**
 * Authenticate request - verifies JWT access token
 * Attaches req.user = { id, role }
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw ApiError.unauthorized('Access token required');
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
    });

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    if (err.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    next(err);
  }
};

/**
 * Optional authentication - does not fail if no token
 * Useful for routes that behave differently for logged-in users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
    });

    const user = await User.findById(decoded.sub);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      };
    }

    next();
  } catch {
    next();
  }
};
