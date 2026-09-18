import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);

export default router;
