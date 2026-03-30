import { Router } from 'express';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import * as chatController from '../controllers/chatController.js';

const router = Router();

router.get('/samples', optionalAuth, chatController.getSamples);
router.post('/stream', optionalAuth, chatController.stream);

export default router;
