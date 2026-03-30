import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { registerSchema, loginSchema, refreshTokenSchema, logoutSchema } from '../validators/authValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(authController.refresh)
);

router.get('/me', authenticate, asyncHandler(authController.me));

router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  asyncHandler(authController.logout)
);

export default router;
