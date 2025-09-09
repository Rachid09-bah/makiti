import { Request, Response } from 'express';
import { Product } from '../models/Product';

export const listProducts = async (req: Request, res: Response) => {
	const { q, vendorId, categoryId, limit = 20, page = 1, recommended } = req.query as any;
	const filter: any = {};
	if (vendorId) filter.vendorId = vendorId;
	if (categoryId) filter.categoryId = categoryId;
	if (q) filter.$text = { $search: q };
	const rec = ['true', '1', 'on', 'yes', 'y'].includes(String(recommended).toLowerCase());
	if (rec) filter.isRecommended = true;
	// Only published products visible to public
	filter.status = 'active';
	const perPage = Math.min(Number(limit) || 20, 100);
	const currentPage = Math.max(Number(page) || 1, 1);
	const [items, total] = await Promise.all([
		Product.find(filter).skip((currentPage - 1) * perPage).limit(perPage).sort({ createdAt: -1 }),
		Product.countDocuments(filter)
	]);
	res.json({ items, total, page: currentPage, limit: perPage });
};

export const getProduct = async (req: Request, res: Response) => {
	const product = await Product.findById(req.params.id);
	if (!product) return res.status(404).json({ message: 'Not found' });
	res.json(product);
};

export const createProduct = async (req: Request, res: Response) => {
	const { title, description, images = [], price, stock, categoryId, tags = [] } = req.body || {};
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	if (!title || price == null || stock == null) return res.status(400).json({ message: 'Missing fields' });
	const product = await Product.create({
		vendorId: req.user.id,
		title,
		description,
		images,
		price,
		stock,
		categoryId,
		tags,
		status: 'active'
	});
	res.status(201).json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
	const { id } = req.params;
	const product = await Product.findById(id);
	if (!product) return res.status(404).json({ message: 'Not found' });
	if (req.user?.role === 'vendor' && String(product.vendorId) !== req.user.id) {
		return res.status(403).json({ message: 'Forbidden' });
	}
	const body: any = { ...(req.body || {}) };
	if (req.user?.role !== 'admin' && Object.prototype.hasOwnProperty.call(body, 'isRecommended')) {
		delete body.isRecommended;
	}
	Object.assign(product, body || {});
	await product.save();
	res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
	const { id } = req.params;
	const product = await Product.findById(id);
	if (!product) return res.status(404).json({ message: 'Not found' });
	if (req.user?.role === 'vendor' && String(product.vendorId) !== req.user.id) {
		return res.status(403).json({ message: 'Forbidden' });
	}
	await product.deleteOne();
	res.status(204).send();
};
