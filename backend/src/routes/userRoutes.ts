import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', authenticate, authorize('admin'), userController.listUsers);
router.post(
  '/staff',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/\d/),
    body('role').isIn(['staff', 'admin']),
  ],
  validate,
  userController.createStaffOrAdmin
);
router.patch('/:id', authenticate, authorize('admin'), userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

export default router;
