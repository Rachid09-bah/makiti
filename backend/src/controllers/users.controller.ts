import { Request, Response } from 'express';
import { User } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

function setupCloudinaryIfConfigured() {
	if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET,
		});
		return true;
	}
	return false;
}

export const getMe = async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	const user = await User.findById(req.user.id).select('name email role phone photoUrl');
	if (!user) return res.status(404).json({ message: 'Not found' });
	return res.json(user);
};

export const updateMe = async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	const user = await User.findById(req.user.id);
	if (!user) return res.status(404).json({ message: 'Not found' });
	const { name, phone } = req.body || {};
	if (name != null) user.name = String(name);
	if (phone != null) user.phone = String(phone);
	if (req.file) {
		let photoUrl: string | undefined;
		if (setupCloudinaryIfConfigured()) {
			const file = req.file as Express.Multer.File;
			photoUrl = await new Promise<string | undefined>((resolve) => {
				const stream = cloudinary.uploader.upload_stream({ folder: 'makiti/avatars' }, (err, result) => {
					if (err || !result) return resolve(undefined);
					return resolve(result.secure_url);
				});
				stream.end(file.buffer);
			});
		} else {
			const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
			await fs.promises.mkdir(uploadsDir, { recursive: true });
			const file = req.file as Express.Multer.File;
			const safeName = `${Date.now()}-${(file.originalname || 'avatar').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
			const destPath = path.join(uploadsDir, safeName);
			await fs.promises.writeFile(destPath, file.buffer);
			const baseUrl = `${req.protocol}://${req.get('host')}`;
			photoUrl = `${baseUrl}/uploads/avatars/${safeName}`;
		}
		if (photoUrl) user.photoUrl = photoUrl;
	}
	await user.save();
	return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, photoUrl: user.photoUrl });
};
