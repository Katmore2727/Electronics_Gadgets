import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { adminOnly } from '../middlewares/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);
router.use(adminOnly);

router.get('/', asyncHandler(userController.getAllCustomers));
router.get('/assigned', asyncHandler(userController.getAssignedUsers));
router.patch('/:id/assign', asyncHandler(userController.assignUser));

export default router;