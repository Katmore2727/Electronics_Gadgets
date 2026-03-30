import * as authService from '../services/authService.js';

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;
  const result = await authService.register({
    email,
    password,
    firstName,
    lastName,
  });
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  res.json({
    success: true,
    message: 'Token refreshed',
    data: result,
  });
};

/**
 * GET /api/auth/me - Get current user (protected)
 */
export const me = async (req, res, next) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  const { refreshToken } = req.body;
  const userId = req.user?.id;
  await authService.logout(userId, refreshToken);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};
