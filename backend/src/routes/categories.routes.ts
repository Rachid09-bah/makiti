import { Router } from 'express';
import { listCategories, createCategory } from '../controllers/categories.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listCategories);
router.post('/', requireAuth, createCategory);

export default router;