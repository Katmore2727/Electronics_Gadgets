import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/roleMiddleware.js';
import {
  createOrderSchema,
  updateStatusSchema,
  orderIdParamSchema,
  orderHistoryQuerySchema,
  cancelOrderSchema,
} from '../validators/orderValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(orderController.create)
);

router.get(
  '/',
  validate(orderHistoryQuerySchema, 'query'),
  asyncHandler(orderController.getHistory)
);

router.get(
  '/admin/all',
  adminOnly,
  validate(orderHistoryQuerySchema, 'query'),
  asyncHandler(orderController.getAll)
);

router.get(
  '/:id',
  validate(orderIdParamSchema, 'params'),
  asyncHandler(orderController.getById)
);

router.patch(
  '/:id/cancel',
  validate(orderIdParamSchema, 'params'),
  validate(cancelOrderSchema),
  asyncHandler(orderController.cancel)
);

router.patch(
  '/:id/status',
  adminOnly,
  validate(orderIdParamSchema, 'params'),
  validate(updateStatusSchema),
  asyncHandler(orderController.updateStatus)
);

export default router;
