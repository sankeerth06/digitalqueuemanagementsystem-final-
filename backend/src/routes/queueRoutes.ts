import { Router } from 'express';
import { body } from 'express-validator';
import * as queueController from '../controllers/queueController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

// Student routes
router.post(
  '/tokens',
  authenticate,
  authorize('student'),
  [body('items').isArray({ min: 1 }).withMessage('At least one item is required')],
  validate,
  queueController.bookToken
);
router.get('/tokens/mine/active', authenticate, authorize('student'), queueController.getMyActiveToken);
router.get('/tokens/mine/history', authenticate, authorize('student'), queueController.getMyHistory);
router.delete('/tokens/:id', authenticate, authorize('student'), queueController.cancelMyToken);
router.get('/tokens/search/:code', authenticate, queueController.searchToken);

// Staff/Admin routes
router.get('/live', authenticate, authorize('staff', 'admin'), queueController.getLiveQueueHandler);
router.get('/skipped', authenticate, authorize('staff', 'admin'), queueController.getSkippedTokensHandler);
router.post(
  '/call-next',
  authenticate,
  authorize('staff', 'admin'),
  [body('counter').isInt({ min: 1 })],
  validate,
  queueController.callNext
);
router.patch('/tokens/:id/ready', authenticate, authorize('staff', 'admin'), queueController.markReady);
router.patch('/tokens/:id/complete', authenticate, authorize('staff', 'admin'), queueController.complete);
router.patch('/tokens/:id/skip', authenticate, authorize('staff', 'admin'), queueController.skip);
router.patch('/tokens/:id/recall', authenticate, authorize('staff', 'admin'), queueController.recall);

export default router;
