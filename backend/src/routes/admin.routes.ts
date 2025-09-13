import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import bcrypt from 'bcrypt';
import { upload } from '../middleware/upload';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { Activity } from '../models/Activity';
import { Setting } from '../models/Setting';

const adminRouter = Router();

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

adminRouter.use(requireAuth, requireRole('admin'));

// Update homepage hero/banner image (admin)
adminRouter.post('/site/hero-image', upload.single('image'), async (req, res) => {
  try {
    const file = (req as any).file as any;
    let imageUrl: string | undefined;

    // allow providing direct URL via body.image
    if (req.body?.image && typeof req.body.image === 'string') {
      imageUrl = String(req.body.image).trim();
    }

    if (file && setupCloudinaryIfConfigured()) {
      const uploadedUrl = await new Promise<string | undefined>((resolve) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'makiti/site' }, (err, result) => {
          if (err || !result) return resolve(undefined);
          resolve(result.secure_url);
        });
        (stream as any).end((file as any).buffer);
      });
      if (uploadedUrl) imageUrl = uploadedUrl;
    } else if (file) {
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'site');
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${(file.originalname || 'hero').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const destPath = path.join(uploadsDir, safeName);
      await fs.promises.writeFile(destPath, (file as any).buffer);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/site/${safeName}`;
    }

    if (!imageUrl) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    const doc = await Setting.findOneAndUpdate(
      { key: 'site.heroImage' },
      { $set: { value: { url: imageUrl } } },
      { upsert: true, new: true }
    );

    try {
      await Activity.create({ userId: req.user?.id, role: req.user?.role as any, scope: 'system', action: 'site.heroImage.update', meta: { url: imageUrl } });
    } catch {}

    return res.json({ ok: true, url: (doc?.value as any)?.url || imageUrl });
  } catch (err: any) {
    return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
  }
});

adminRouter.get('/stats', async (_req, res) => {
	const [users, vendors, products, orders] = await Promise.all([
		User.countDocuments({}),
		Vendor.countDocuments({}),
		Product.countDocuments({}),
		Order.countDocuments({}),
	]);
	res.json({ users, vendors, products, orders });
});

adminRouter.get('/users', async (_req, res) => {
	const users = await User.find({}).select('name email role phone createdAt verified');
	res.json(users);
});

// Create user
adminRouter.post('/users', async (req, res) => {
	try {
		const name = String(req.body?.name || '').trim();
		const email = String(req.body?.email || '').toLowerCase().trim();
		const role = String(req.body?.role || '').trim();
		const phone = req.body?.phone ? String(req.body.phone).trim() : undefined;
		const password = String(req.body?.password || '');
		const verified = Boolean(req.body?.verified);

		if (!name || !email || !role || !password) {
			return res.status(400).json({ message: 'Champs requis manquants (name, email, role, password)' });
		}
		if (!['admin', 'vendor', 'customer'].includes(role)) {
			return res.status(400).json({ message: 'Rôle invalide' });
		}
		if (password.length < 6) {
			return res.status(400).json({ message: 'Mot de passe trop court (min 6)' });
		}
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, role, phone, passwordHash, verified });
		return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt, verified: user.verified });
	} catch (err: any) {
		if (err?.code === 11000) return res.status(409).json({ message: 'Email déjà utilisé' });
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Update user
adminRouter.patch('/users/:id', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const user = await User.findById(id);
		if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

		const allowedRoles = ['admin', 'vendor', 'customer'];
		if (req.body?.name != null) user.name = String(req.body.name).trim();
		if (req.body?.email != null) user.email = String(req.body.email).toLowerCase().trim();
		if (req.body?.role != null) {
			const r = String(req.body.role).trim();
			if (!allowedRoles.includes(r)) return res.status(400).json({ message: 'Rôle invalide' });
			user.role = r as any;
		}
		if (req.body?.phone != null) user.phone = String(req.body.phone).trim();
		if (req.body?.verified != null) user.verified = Boolean(req.body.verified);

		await user.save();
		return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, createdAt: user.createdAt, verified: user.verified });
	} catch (err: any) {
		if (err?.code === 11000) return res.status(409).json({ message: 'Email déjà utilisé' });
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Delete user
adminRouter.delete('/users/:id', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const deleted = await User.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ message: 'Utilisateur introuvable' });
		return res.json({ ok: true });
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Create vendor
adminRouter.post('/vendors', async (req, res) => {
	try {
		const vendorName = String(req.body?.vendorName || '').trim();
		const userName = String(req.body?.userName || '').trim();
		const userEmail = String(req.body?.userEmail || '').toLowerCase().trim();
		const password = String(req.body?.password || '');
		const phone = req.body?.phone ? String(req.body.phone).trim() : undefined;
		const location = req.body?.location ? String(req.body.location).trim() : undefined;
		const status = (String(req.body?.status || 'approved').trim()) as any; // default approved
		const payout = req.body?.payoutMobileMoney as { msisdn?: string; provider?: string } | undefined;

		if (!vendorName || !userName || !userEmail || !password) {
			return res.status(400).json({ message: 'Champs requis manquants (vendorName, userName, userEmail, password)' });
		}
		if (password.length < 6) return res.status(400).json({ message: 'Mot de passe trop court (min 6)' });
		const exists = await User.findOne({ email: userEmail });
		if (exists) return res.status(409).json({ message: 'Email déjà utilisé' });

		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name: userName, email: userEmail, passwordHash, role: 'vendor', phone, verified: true });
		const vendor = await Vendor.create({
			userId: user._id,
			name: vendorName,
			location,
			status: ['pending', 'approved', 'rejected'].includes(status) ? status : 'approved',
			payoutMobileMoney: payout && (payout.msisdn || payout.provider) ? { msisdn: String(payout.msisdn || ''), provider: String(payout.provider || '') } : undefined
		});
		return res.status(201).json({
			id: vendor.id,
			name: vendor.name,
			status: vendor.status,
			location: vendor.location,
			createdAt: vendor.createdAt,
			user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
		});
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

adminRouter.get('/vendors', async (req, res) => {
	const q: any = {};
	const status = (req.query?.status || '') as string;
	if (status && ['pending','approved','rejected'].includes(String(status))) {
		q.status = String(status);
	}
	const vendors = await Vendor.find(q)
		.select('name status location createdAt userId')
		.populate('userId', 'name email phone');
	const payload = vendors.map((v: any) => ({
		id: v.id,
		name: v.name,
		status: v.status,
		location: v.location,
		createdAt: v.createdAt,
		user: v.userId ? { id: String(v.userId._id), name: v.userId.name, email: v.userId.email, phone: v.userId.phone } : { id: '', name: '', email: '' }
	}));
	res.json(payload);
});

// Approve vendor
adminRouter.patch('/vendors/:id/approve', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const vendor = await Vendor.findById(id);
		if (!vendor) return res.status(404).json({ message: 'Vendeur introuvable' });
		if (vendor.status === 'approved') return res.status(400).json({ message: 'Déjà approuvé' });
		vendor.status = 'approved';
		await vendor.save();
		// Ensure linked user has vendor role
		const user = await User.findById(String(vendor.userId));
		if (user && user.role !== 'vendor') {
			user.role = 'vendor' as any;
			await user.save();
		}
		try {
			await Activity.create({ userId: req.user?.id, role: req.user?.role as any, scope: 'system', action: 'vendor.approve', meta: { vendorId: vendor.id, userId: String(vendor.userId) } });
		} catch {}
		return res.json({ id: vendor.id, status: vendor.status, userId: String(vendor.userId) });
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Reject vendor
adminRouter.patch('/vendors/:id/reject', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const vendor = await Vendor.findById(id);
		if (!vendor) return res.status(404).json({ message: 'Vendeur introuvable' });
		vendor.status = 'rejected';
		await vendor.save();
		try {
			await Activity.create({ userId: req.user?.id, role: req.user?.role as any, scope: 'system', action: 'vendor.reject', meta: { vendorId: vendor.id, userId: String(vendor.userId) } });
		} catch {}
		return res.json({ id: vendor.id, status: vendor.status, userId: String(vendor.userId) });
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Create product (admin only)
adminRouter.post('/products', upload.single('image'), async (req, res) => {
	try {
		const { vendorId, title } = req.body || {};
		const price = Number(req.body?.price);
		const stock = Number(req.body?.stock);
		const description = req.body?.description ? String(req.body.description) : undefined;
		const file = (req as any).file as any;
		let images: string[] = [];
		if (Array.isArray(req.body?.images)) images = (req.body.images as any[]).map(String).filter(Boolean);
		else if (typeof req.body?.images === 'string') images = [String(req.body.images)].filter(Boolean);
		else if (req.body?.image && typeof req.body.image === 'string') images = [String(req.body.image)].filter(Boolean);
		if (file && setupCloudinaryIfConfigured()) {
			const uploadedUrl = await new Promise<string | undefined>((resolve) => {
				const stream = cloudinary.uploader.upload_stream({ folder: 'makiti/products' }, (err, result) => {
					if (err || !result) return resolve(undefined);
					resolve(result.secure_url);
				});
				(stream as any).end((file as any).buffer);
			});
			if (uploadedUrl) images = [uploadedUrl];
		} else if (file) {
			// Fallback: save locally and expose via /uploads
			const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
			await fs.promises.mkdir(uploadsDir, { recursive: true });
			const safeName = `${Date.now()}-${(file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
			const destPath = path.join(uploadsDir, safeName);
			await fs.promises.writeFile(destPath, (file as any).buffer);
			const baseUrl = `${req.protocol}://${req.get('host')}`;
			images = [`${baseUrl}/uploads/products/${safeName}`];
		}
		let tags: string[] = [];
		if (Array.isArray(req.body?.tags)) tags = (req.body.tags as any[]).map(String);
		else if (typeof req.body?.tags === 'string') tags = String(req.body.tags).split(',').map(s => s.trim()).filter(Boolean);
		const categoryId = req.body?.categoryId ? String(req.body.categoryId) : undefined;
		const status = ['active', 'inactive', 'pending'].includes(String(req.body?.status)) ? String(req.body.status) : 'active';
		const isRecommended = req.body?.isRecommended != null ? ['true', '1', 'on', 'yes', 'y'].includes(String(req.body.isRecommended).toLowerCase()) : false;

		if (!vendorId || !title || isNaN(price) || isNaN(stock)) {
			return res.status(400).json({ message: 'vendorId, title, price, stock requis' });
		}
		if (!images || images.length === 0) {
			return res.status(400).json({ message: 'Au moins une image est requise' });
		}
		const vendor = await Vendor.findById(String(vendorId));
		if (!vendor) return res.status(404).json({ message: 'Vendeur introuvable' });

		const product = await Product.create({
			vendorId: vendor._id,
			title: String(title),
			description,
			images,
			price,
			stock,
			categoryId,
			tags,
			status,
			isRecommended
		});
		return res.status(201).json({
			id: product.id,
			vendorId: String(product.vendorId),
			title: product.title,
			price: product.price,
			stock: product.stock,
			status: product.status,
			isRecommended: product.isRecommended,
			createdAt: product.createdAt
		});
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Update product (admin only)
adminRouter.patch('/products/:id', upload.single('image'), async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const product = await Product.findById(id);
		if (!product) return res.status(404).json({ message: 'Produit introuvable' });

		// Basic fields
		if (req.body?.title != null) product.title = String(req.body.title);
		if (req.body?.price != null && !isNaN(Number(req.body.price))) product.price = Number(req.body.price);
		if (req.body?.stock != null && !isNaN(Number(req.body.stock))) product.stock = Number(req.body.stock);
		if (req.body?.description != null) product.description = String(req.body.description);
		if (req.body?.status && ['active', 'inactive', 'pending'].includes(String(req.body.status))) product.status = String(req.body.status) as any;
		if (req.body?.isRecommended != null) product.isRecommended = ['true', '1', 'on', 'yes', 'y'].includes(String(req.body.isRecommended).toLowerCase());
		if (req.body?.tags) {
			if (Array.isArray(req.body.tags)) product.tags = (req.body.tags as any[]).map(String);
			else if (typeof req.body.tags === 'string') product.tags = String(req.body.tags).split(',').map(s => s.trim()).filter(Boolean);
		}
		if (req.body?.vendorId) {
			const v = await Vendor.findById(String(req.body.vendorId));
			if (!v) return res.status(404).json({ message: 'Vendeur introuvable' });
			product.vendorId = v._id as any;
		}
		if (req.body?.categoryId != null) {
			product.categoryId = req.body.categoryId ? String(req.body.categoryId) : undefined;
		}

		// Image update
		const file = (req as any).file as any;
		let images: string[] | undefined;
		if (Array.isArray(req.body?.images)) images = (req.body.images as any[]).map(String).filter(Boolean);
		else if (typeof req.body?.images === 'string') images = [String(req.body.images)].filter(Boolean);
		else if (req.body?.image && typeof req.body.image === 'string') images = [String(req.body.image)].filter(Boolean);
		if (file && setupCloudinaryIfConfigured()) {
			const uploadedUrl = await new Promise<string | undefined>((resolve) => {
				const stream = cloudinary.uploader.upload_stream({ folder: 'makiti/products' }, (err, result) => {
					if (err || !result) return resolve(undefined);
					resolve(result.secure_url);
				});
				(stream as any).end((file as any).buffer);
			});
			if (uploadedUrl) images = [uploadedUrl];
		} else if (file) {
			const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
			await fs.promises.mkdir(uploadsDir, { recursive: true });
			const safeName = `${Date.now()}-${(file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
			const destPath = path.join(uploadsDir, safeName);
			await fs.promises.writeFile(destPath, (file as any).buffer);
			const baseUrl = `${req.protocol}://${req.get('host')}`;
			images = [`${baseUrl}/uploads/products/${safeName}`];
		}
		if (images && images.length > 0) product.images = images;

		await product.save();
		return res.json({
			id: product.id,
			vendorId: String(product.vendorId),
			title: product.title,
			price: product.price,
			stock: product.stock,
			status: product.status,
			isRecommended: product.isRecommended,
			categoryId: product.categoryId,
			createdAt: product.createdAt
		});
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Delete product (admin only)
adminRouter.delete('/products/:id', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const product = await Product.findById(id);
		if (!product) return res.status(404).json({ message: 'Produit introuvable' });
		await product.deleteOne();
		return res.json({ ok: true });
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

adminRouter.get('/products', async (_req, res) => {
	const products = await Product.find({}).select('vendorId title price stock status isRecommended categoryId createdAt');
	res.json(products);
});

// Orders management (admin)
adminRouter.get('/orders', async (req, res) => {
	try {
		const { page = '1', limit = '50', status, paymentStatus, q } = req.query as Record<string, string>;
		const perPage = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
		const currentPage = Math.max(parseInt(String(page), 10) || 1, 1);
		const skip = (currentPage - 1) * perPage;
		const query: any = {};
		if (status) query.status = status;
		if (paymentStatus) query.paymentStatus = paymentStatus;
		if (q) {
			// basic search on paymentRef or deliveryAddress
			query.$or = [
				{ paymentRef: { $regex: q, $options: 'i' } },
				{ deliveryAddress: { $regex: q, $options: 'i' } }
			];
		}
		const [items, total] = await Promise.all([
			Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage)
				.populate('customerId', 'name email')
				.populate('vendorId', 'name'),
			Order.countDocuments(query)
		]);
		res.json({
			items: items.map((o: any) => ({
				id: o.id,
				customer: o.customerId ? { id: o.customerId.id, name: o.customerId.name, email: o.customerId.email } : undefined,
				vendor: o.vendorId ? { id: o.vendorId.id, name: o.vendorId.name } : undefined,
				items: o.items,
				subtotal: o.subtotal,
				deliveryFee: o.deliveryFee,
				commissionAmount: o.commissionAmount,
				total: o.total,
				status: o.status,
				paymentStatus: o.paymentStatus,
				paymentRef: o.paymentRef,
				deliveryAddress: o.deliveryAddress,
				createdAt: o.createdAt
			})),
			total,
			page: currentPage,
			limit: perPage
		});
	} catch (err: any) {
		res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

adminRouter.get('/orders/:id', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const o: any = await Order.findById(id)
			.populate('customerId', 'name email')
			.populate('vendorId', 'name');
		if (!o) return res.status(404).json({ message: 'Commande introuvable' });
		res.json({
			id: o.id,
			customer: o.customerId ? { id: o.customerId.id, name: o.customerId.name, email: o.customerId.email } : undefined,
			vendor: o.vendorId ? { id: o.vendorId.id, name: o.vendorId.name } : undefined,
			items: o.items,
			subtotal: o.subtotal,
			deliveryFee: o.deliveryFee,
			commissionAmount: o.commissionAmount,
			total: o.total,
			status: o.status,
			paymentStatus: o.paymentStatus,
			paymentRef: o.paymentRef,
			deliveryAddress: o.deliveryAddress,
			timeline: o.timeline,
			createdAt: o.createdAt
		});
	} catch (err: any) {
		res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

adminRouter.patch('/orders/:id', async (req, res) => {
	try {
		const { id } = req.params as { id: string };
		const o: any = await Order.findById(id);
		if (!o) return res.status(404).json({ message: 'Commande introuvable' });
		let statusChanged = false;
		if (req.body?.status && ['pending','paid','shipped','delivered','cancelled'].includes(String(req.body.status))) {
			if (o.status !== req.body.status) {
				statusChanged = true;
				o.status = req.body.status;
				o.timeline.push({ status: String(req.body.status), at: new Date() });
			}
		}
		if (req.body?.paymentStatus && ['pending','paid','failed','refunded'].includes(String(req.body.paymentStatus))) {
			o.paymentStatus = req.body.paymentStatus;
		}
		if (req.body?.paymentRef != null) o.paymentRef = String(req.body.paymentRef);
		if (req.body?.deliveryAddress != null) o.deliveryAddress = String(req.body.deliveryAddress);
		await o.save();
		// record admin activity
		try {
			await Activity.create({ userId: req.user?.id, role: req.user?.role, scope: 'system', action: 'order.update', meta: { id: o.id, status: o.status, paymentStatus: o.paymentStatus } });
		} catch {}
		return res.json({
			id: o.id,
			status: o.status,
			paymentStatus: o.paymentStatus,
			paymentRef: o.paymentRef,
			deliveryAddress: o.deliveryAddress,
			updatedAt: o.updatedAt
		});
	} catch (err: any) {
		res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Insights (totaux, tendances, top vendeurs, derniers produits, activités)
adminRouter.get('/insights', async (_req, res) => {
	try {
		const now = new Date();
		const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const prevStart7 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

		const [
			totalUsers,
			totalVendors,
			totalProducts,
			totalOrders,
			users7,
			vendors7,
			products7,
			orders7,
			usersPrev7,
			vendorsPrev7,
			productsPrev7,
			ordersPrev7,
			topVendorsAgg,
			latestProducts,
			latestUsers,
			latestVendors,
			latestOrders
		] = await Promise.all([
			User.countDocuments({}),
			Vendor.countDocuments({}),
			Product.countDocuments({}),
			Order.countDocuments({}),
			User.countDocuments({ createdAt: { $gte: start7 } }),
			Vendor.countDocuments({ createdAt: { $gte: start7 } }),
			Product.countDocuments({ createdAt: { $gte: start7 } }),
			Order.countDocuments({ createdAt: { $gte: start7 } }),
			User.countDocuments({ createdAt: { $gte: prevStart7, $lt: start7 } }),
			Vendor.countDocuments({ createdAt: { $gte: prevStart7, $lt: start7 } }),
			Product.countDocuments({ createdAt: { $gte: prevStart7, $lt: start7 } }),
			Order.countDocuments({ createdAt: { $gte: prevStart7, $lt: start7 } }),
			// top vendeurs par nombre de produits
			Product.aggregate([
				{ $group: { _id: '$vendorId', productsCount: { $sum: 1 } } },
				{ $sort: { productsCount: -1 } },
				{ $limit: 5 }
			]),
			Product.find({}).select('title price createdAt').sort({ createdAt: -1 }).limit(5),
			User.find({}).select('name email createdAt').sort({ createdAt: -1 }).limit(5),
			Vendor.find({}).select('name createdAt').sort({ createdAt: -1 }).limit(5),
			Order.find({}).select('total createdAt').sort({ createdAt: -1 }).limit(5)
		]);

		function pct(curr: number, prev: number) {
			if (prev === 0) return curr > 0 ? 100 : 0;
			return Math.round(((curr - prev) / prev) * 100);
		}

		// peupler top vendeurs
		const vendorIds = topVendorsAgg.map((v: any) => v._id);
		const vendorsDocs = await Vendor.find({ _id: { $in: vendorIds } }).select('name createdAt');
		const vendorsMap = new Map(vendorsDocs.map((v: any) => [String(v._id), v]));
		const topVendors = topVendorsAgg.map((v: any) => ({
			id: String(v._id),
			name: vendorsMap.get(String(v._id))?.name || 'Vendeur',
			productsCount: v.productsCount,
			createdAt: vendorsMap.get(String(v._id))?.createdAt
		}));

		// activités récentes (fusionner dernières entités)
		const activities: any[] = [];
		latestUsers.forEach((u: any) => activities.push({ type: 'user', label: u.email || u.name, at: u.createdAt }));
		latestVendors.forEach((v: any) => activities.push({ type: 'vendor', label: v.name, at: v.createdAt }));
		latestProducts.forEach((p: any) => activities.push({ type: 'product', label: p.title, at: p.createdAt }));
		latestOrders.forEach((o: any) => activities.push({ type: 'order', label: `Commande ${o.total}`, at: o.createdAt }));
		activities.sort((a, b) => (b.at as any) - (a.at as any));
		const recentActivities = activities.slice(0, 10);

		// Build daily series for last 14 days
		const start14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
		function buildLabels(start: Date, end: Date) {
			const labels: string[] = [];
			const d = new Date(start);
			while (d <= end) {
				labels.push(d.toISOString().slice(0, 10));
				d.setDate(d.getDate() + 1);
			}
			return labels;
		}
		function toSeries(labels: string[], agg: { _id: string; count: number }[]) {
			const map = new Map(agg.map(x => [x._id, x.count]));
			return labels.map(l => Number(map.get(l) || 0));
		}
		const labels = buildLabels(new Date(start14), now);
		const [usersDailyAgg, vendorsDailyAgg, productsDailyAgg, ordersDailyAgg, activitiesDailyAgg] = await Promise.all([
			User.aggregate([
				{ $match: { createdAt: { $gte: start14 } } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
				{ $sort: { _id: 1 } }
			]),
			Vendor.aggregate([
				{ $match: { createdAt: { $gte: start14 } } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
				{ $sort: { _id: 1 } }
			]),
			Product.aggregate([
				{ $match: { createdAt: { $gte: start14 } } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
				{ $sort: { _id: 1 } }
			]),
			Order.aggregate([
				{ $match: { createdAt: { $gte: start14 } } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
				{ $sort: { _id: 1 } }
			]),
			Activity.aggregate([
				{ $match: { createdAt: { $gte: start14 } } },
				{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
				{ $sort: { _id: 1 } }
			])
		]);
		const series = {
			usersDaily: { labels, data: toSeries(labels, usersDailyAgg as any) },
			vendorsDaily: { labels, data: toSeries(labels, vendorsDailyAgg as any) },
			productsDaily: { labels, data: toSeries(labels, productsDailyAgg as any) },
			ordersDaily: { labels, data: toSeries(labels, ordersDailyAgg as any) },
			activitiesDaily: { labels, data: toSeries(labels, activitiesDailyAgg as any) }
		};

		return res.json({
			totals: { users: totalUsers, vendors: totalVendors, products: totalProducts, orders: totalOrders },
			deltas: {
				users: pct(users7, usersPrev7),
				vendors: pct(vendors7, vendorsPrev7),
				products: pct(products7, productsPrev7),
				orders: pct(orders7, ordersPrev7)
			},
			topVendors,
			latestProducts: latestProducts.map((p: any) => ({ id: p.id, title: p.title, price: p.price, createdAt: p.createdAt })),
			recentActivities,
			series
		});
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur', error: err?.message });
	}
});

// Activities listing (admin)
adminRouter.get('/activities', async (req, res) => {
  try {
    const { scope, action, userId, limit = '50', page = '1' } = req.query as Record<string, string>;
    const q: any = {};
    if (scope) q.scope = scope;
    if (action) q.action = action;
    if (userId) q.userId = userId;
    const perPage = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
    const currentPage = Math.max(parseInt(String(page), 10) || 1, 1);
    const skip = (currentPage - 1) * perPage;
    const [items, total] = await Promise.all([
      Activity.find(q).sort({ createdAt: -1 }).skip(skip).limit(perPage).populate('userId', 'name email role'),
      Activity.countDocuments(q)
    ]);
    res.json({
      items: items.map((a: any) => ({
        id: a.id,
        scope: a.scope,
        action: a.action,
        user: a.userId ? { id: a.userId.id, name: a.userId.name, email: a.userId.email, role: a.userId.role } : undefined,
        role: a.role,
        meta: a.meta,
        ip: a.ip,
        userAgent: a.userAgent,
        createdAt: a.createdAt,
      })),
      total,
      page: currentPage,
      limit: perPage
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur', error: err?.message });
  }
});

export default adminRouter;
