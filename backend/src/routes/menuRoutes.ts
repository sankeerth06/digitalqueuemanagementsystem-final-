import { Router } from 'express';
import { body } from 'express-validator';
import * as menuController from '../controllers/menuController';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

router.get('/', authenticate, menuController.listMenuItems);
router.get('/:id', authenticate, menuController.getMenuItem);

const menuItemValidators = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('category').isIn(['Breakfast', 'Meals', 'Snacks', 'Beverages', 'Combos']),
  body('price').isFloat({ min: 0 }),
  body('prepTimeMinutes').isInt({ min: 1 }),
  body('stock').optional().isInt({ min: 0 }),
];

router.post('/', authenticate, authorize('admin'), menuItemValidators, validate, menuController.createMenuItem);
router.patch('/:id', authenticate, authorize('admin'), menuController.updateMenuItem);
router.delete('/:id', authenticate, authorize('admin'), menuController.deleteMenuItem);

export default router;
