import { Router } from 'express';
import { getCategories } from '../controllers/health';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getCategories);

export default router;
