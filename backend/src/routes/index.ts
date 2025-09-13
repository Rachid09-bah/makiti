import { Router } from 'express';
import { requireAuth, requireRole, attachUserFromJWT } from '../middleware/auth';
import authRouter from './auth.routes';
import logoutRouter from './logout';
import cartRouter from './cart';
import paymentsRouter from './payments.routes';
import productsRouter from './products.routes';
import ordersRouter from './orders.routes';
import usersRouter from './users.routes';
import adminRouter from './admin.routes';
import adminMonitoringRouter from './admin';
import supportRouter from './support.routes';
import siteRouter from './site.routes';
import mailRouter from './mail.routes';
import categoriesRouter from './categories.routes';

const router = Router();

router.use(attachUserFromJWT);

router.use('/auth', authRouter);
router.use('/auth', logoutRouter);
router.use('/cart', cartRouter);
router.use('/payments', paymentsRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);
router.use('/users', usersRouter);
router.use('/categories', categoriesRouter);
router.use('/admin', adminRouter);
router.use('/admin/monitoring', adminMonitoringRouter);
router.use('/support', supportRouter);

router.use(mailRouter);

router.get('/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});

router.get('/admin/ping', requireAuth, requireRole('admin'), (_req, res) => {
	res.json({ ok: true });
});

export default router;
