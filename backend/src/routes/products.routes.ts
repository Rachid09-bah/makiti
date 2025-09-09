import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller';

const productsRouter = Router();

productsRouter.get('/', listProducts);
productsRouter.get('/:id', getProduct);
productsRouter.post('/', requireAuth, requireRole(['vendor', 'admin']), createProduct);
productsRouter.patch('/:id', requireAuth, requireRole(['vendor', 'admin']), updateProduct);
productsRouter.delete('/:id', requireAuth, requireRole(['vendor', 'admin']), deleteProduct);

export default productsRouter;
