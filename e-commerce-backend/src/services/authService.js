import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import config from '../config/index.js';

/**
 * Hash a refresh token for secure storage
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generate access token
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },
    config.jwt.accessSecret,
    {
      expiresIn: config.jwt.accessExpiry,
      issuer: config.jwt.issuer,
    }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry,
      issuer: config.jwt.issuer,
    }
  );
};

/**
 * Register a new user
 */
export const register = async (data) => {
  const { email, password, firstName, lastName } = data;

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
  const user = await User.create({
    email,
    passwordHash,
    firstName,
    lastName,
    role: User.USER_ROLES.CUSTOMER,
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  const tokenHash = hashToken(refreshToken);
  const decoded = jwt.decode(refreshToken);
  await User.saveRefreshToken(user.id, tokenHash, new Date(decoded.exp * 1000));

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isVerified: user.is_verified,
    },
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiry,
  };
};

/**
 * Login user
 */
export const login = async (email, password) => {
  const user = await User.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  const tokenHash = hashToken(refreshToken);
  const decoded = jwt.decode(refreshToken);
  await User.saveRefreshToken(user.id, tokenHash, new Date(decoded.exp * 1000));

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isVerified: user.is_verified,
    },
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiry,
  };
};

/**
 * Refresh access token
 */
export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
    });
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  if (decoded.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid token type');
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await User.findRefreshToken(decoded.sub, tokenHash);
  if (!storedToken) {
    throw ApiError.unauthorized('Refresh token revoked or expired');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  // Revoke old refresh token (optional: rotate on each refresh)
  await User.deleteRefreshToken(user.id, tokenHash);

  const newTokenHash = hashToken(newRefreshToken);
  const newDecoded = jwt.decode(newRefreshToken);
  await User.saveRefreshToken(user.id, newTokenHash, new Date(newDecoded.exp * 1000));

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isVerified: user.is_verified,
    },
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: config.jwt.accessExpiry,
  };
};

/**
 * Logout - revoke refresh token
 */
export const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await User.deleteRefreshToken(userId, tokenHash);
  } else {
    await User.deleteAllUserRefreshTokens(userId);
  }
};
