import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/overview', authenticate, authorize('staff', 'admin'), analyticsController.getOverview);
router.get('/daily-trend', authenticate, authorize('staff', 'admin'), analyticsController.getDailyOrdersTrend);
router.get('/peak-hours', authenticate, authorize('staff', 'admin'), analyticsController.getPeakHours);
router.get('/top-items', authenticate, authorize('staff', 'admin'), analyticsController.getTopItems);
router.get('/revenue-by-category', authenticate, authorize('staff', 'admin'), analyticsController.getRevenueByCategory);

export default router;
