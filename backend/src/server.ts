import http from 'http';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import app from './app';
import { initializeSocketService } from './services/socketService';

config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/makiti';

async function connectDatabase(): Promise<void> {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('MongoDB connected');
	} catch (err) {
		console.warn('MongoDB connection failed. Server will run without DB. Error:', err);
	}
}

function startServer() {
	const server = http.createServer(app);
	
	// Initialiser Socket.IO pour le monitoring admin
	initializeSocketService(server);
	console.log('Socket.IO initialized for admin monitoring');
	
	server.listen(PORT, () => {
		console.log(`API listening on http://localhost:${PORT}`);
		console.log(`Admin monitoring available via WebSocket`);
	});
}

startServer();
void connectDatabase();

// Seed minimal admin user if not present (on startup, non-blocking)
import { User } from './models/User';
import { Category } from './models/Category';
import bcrypt from 'bcrypt';
void (async () => {
	try {
		const countAdmins = await User.countDocuments({ role: 'admin' });
		if (countAdmins === 0) {
			const passwordHash = await bcrypt.hash('admin123', 10);
			await User.create({ name: 'Admin', email: 'admin@makiti.local', passwordHash, role: 'admin', verified: true });
			console.log('Seeded default admin: admin@makiti.local / admin123');
		}
		
		// Seed categories
		const countCategories = await Category.countDocuments();
		if (countCategories === 0) {
			const categories = [
				{ name: 'Leppi & Tenues traditionnelles', slug: 'leppi-tenues' },
				{ name: 'Bazin & Tissus', slug: 'bazin-tissus' },
				{ name: 'Chaussures', slug: 'chaussures' },
				{ name: 'Artisanat & Décoration', slug: 'artisanat-decoration' },
				{ name: 'Bijoux & Accessoires', slug: 'bijoux-accessoires' },
				{ name: 'Cosmétiques naturels', slug: 'cosmetiques-naturels' },
				{ name: 'Épices & Agroalimentaire', slug: 'epices-agroalimentaire' },
				{ name: 'Paniers & Vannerie', slug: 'paniers-vannerie' }
			];
			await Category.insertMany(categories);
			console.log('Seeded default categories');
		}
		
		// Associate existing products with categories
		const { Product } = await import('./models/Product');
		const categories = await Category.find();
		const productsWithoutCategory = await Product.find({ categoryId: { $exists: false } });
		
		for (const product of productsWithoutCategory) {
			const title = product.title.toLowerCase();
			let categoryId = null;
			
			if (title.includes('leppi') || title.includes('tenue')) {
				categoryId = categories.find(c => c.slug === 'leppi-tenues')?._id;
			} else if (title.includes('bazin') || title.includes('tissu')) {
				categoryId = categories.find(c => c.slug === 'bazin-tissus')?._id;
			} else if (title.includes('chaussure') || title.includes('soulier')) {
				categoryId = categories.find(c => c.slug === 'chaussures')?._id;
			} else if (title.includes('bijou') || title.includes('accessoire')) {
				categoryId = categories.find(c => c.slug === 'bijoux-accessoires')?._id;
			} else if (title.includes('cosmétique') || title.includes('beauté')) {
				categoryId = categories.find(c => c.slug === 'cosmetiques-naturels')?._id;
			} else if (title.includes('épice') || title.includes('alimentaire')) {
				categoryId = categories.find(c => c.slug === 'epices-agroalimentaire')?._id;
			} else if (title.includes('panier') || title.includes('vannerie')) {
				categoryId = categories.find(c => c.slug === 'paniers-vannerie')?._id;
			} else {
				// Artisanat par défaut
				categoryId = categories.find(c => c.slug === 'artisanat-decoration')?._id;
			}
			
			if (categoryId) {
				product.categoryId = categoryId;
				await product.save();
			}
		}
		
		if (productsWithoutCategory.length > 0) {
			console.log(`Associated ${productsWithoutCategory.length} products with categories`);
		}
	} catch {}
})();
