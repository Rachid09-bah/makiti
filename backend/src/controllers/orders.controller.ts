import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';

const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 0.08);

export const createOrder = async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	const { items = [], vendorId, deliveryAddress = '' } = req.body || {};
	if (!Array.isArray(items) || items.length === 0 || !vendorId) {
		return res.status(400).json({ message: 'Invalid payload' });
	}
	// Price check from DB
	const productIds = items.map((i: any) => i.productId);
	const products = await Product.find({ _id: { $in: productIds } });
	const priceMap = new Map(products.map((p) => [String(p._id), p.price]));
	let subtotal = 0;
	const normalized = items.map((i: any) => {
		const price = priceMap.get(String(i.productId));
		if (price == null) throw new Error('Product not found');
		subtotal += price * Number(i.qty || 1);
		return { productId: i.productId, title: i.title || '', price, qty: Number(i.qty || 1) };
	});
	const deliveryFee = Number(process.env.DEFAULT_DELIVERY_FEE || 0);
	const commissionAmount = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
	const total = subtotal + deliveryFee;
	const order = await Order.create({
		customerId: req.user.id,
		vendorId,
		items: normalized,
		subtotal,
		deliveryFee,
		commissionAmount,
		total,
		status: 'pending',
		paymentStatus: 'pending',
		deliveryAddress,
		timeline: [{ status: 'created', at: new Date() }]
	});
	res.status(201).json(order);
};

export const getMyOrders = async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
	res.json(orders);
};

export const getOrderById = async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	const order = await Order.findById(req.params.id);
	if (!order) return res.status(404).json({ message: 'Not found' });
	// Simple access control: owner or vendor or admin
	if (
		req.user.role !== 'admin' &&
		String(order.customerId) !== req.user.id &&
		String(order.vendorId) !== req.user.id
	) {
		return res.status(403).json({ message: 'Forbidden' });
	}
	res.json(order);
};
