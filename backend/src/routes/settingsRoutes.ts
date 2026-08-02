import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, settingsController.getSystemSettings);
router.patch('/', authenticate, authorize('admin'), settingsController.updateSystemSettings);
router.post('/pause', authenticate, authorize('staff', 'admin'), settingsController.pauseQueue);
router.post('/resume', authenticate, authorize('staff', 'admin'), settingsController.resumeQueue);

export default router;
