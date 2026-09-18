import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

export default router;
