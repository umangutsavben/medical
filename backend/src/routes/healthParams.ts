import { Router } from 'express';
import {
  getHealthParameters,
  getParameterMeasurements,
  correctMeasurement,
} from '../controllers/health';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getHealthParameters);
router.get('/:type', authMiddleware, getParameterMeasurements);
router.post('/:id/correct', authMiddleware, correctMeasurement);

export default router;
