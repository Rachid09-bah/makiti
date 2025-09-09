import { Router } from 'express';

const paymentsRouter = Router();

paymentsRouter.post('/initiate', (req, res) => {
	// Placeholder: validate order and create payment session
	const { orderId, provider } = req.body || {};
	if (!orderId || !provider) return res.status(400).json({ message: 'orderId and provider required' });
	return res.json({ paymentRef: `SIM-${Date.now()}`, provider, status: 'pending' });
});

paymentsRouter.post('/webhook/:provider', (req, res) => {
	// Placeholder: trust all callbacks and mark as paid
	const { provider } = req.params;
	return res.status(200).json({ ok: true, provider });
});

export default paymentsRouter;
