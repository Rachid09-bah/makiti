import { Request, Response } from 'express';
import { Category } from '../models/Category';

export const listCategories = async (req: Request, res: Response) => {
	const categories = await Category.find().sort({ name: 1 });
	res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
	const { name, slug, parentId } = req.body || {};
	if (!name || !slug) return res.status(400).json({ message: 'Missing fields' });
	const category = await Category.create({ name, slug, parentId });
	res.status(201).json(category);
};