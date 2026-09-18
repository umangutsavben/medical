import { Router } from 'express';
import { getHealthTrends } from '../controllers/health';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/:parameter', authMiddleware, getHealthTrends);

export default router;
