
import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Protect dashboard routes

router.get('/summary', getDashboardSummary);

export default router;
