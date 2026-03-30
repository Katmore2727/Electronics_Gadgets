import { Router } from 'express';
import * as cartController from '../controllers/cartController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  addItemSchema,
  updateQuantitySchema,
  productIdParamSchema,
} from '../validators/cartValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(cartController.getCart));

router.post(
  '/items',
  validate(addItemSchema),
  asyncHandler(cartController.addItem)
);

router.patch(
  '/items/:productId',
  validate(productIdParamSchema, 'params'),
  validate(updateQuantitySchema),
  asyncHandler(cartController.updateQuantity)
);

router.delete(
  '/items/:productId',
  validate(productIdParamSchema, 'params'),
  asyncHandler(cartController.removeItem)
);

router.delete('/', asyncHandler(cartController.clearCart));

export default router;
