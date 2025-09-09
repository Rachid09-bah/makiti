import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orders.controller';
import { trackOrderActivity } from '../middleware/activityTracker';

const ordersRouter = Router();

ordersRouter.post('/', requireAuth, trackOrderActivity, createOrder);
ordersRouter.get('/me', requireAuth, getMyOrders);
ordersRouter.get('/:id', requireAuth, getOrderById);

export default ordersRouter;
