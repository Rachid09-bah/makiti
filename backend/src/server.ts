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
import bcrypt from 'bcrypt';
void (async () => {
	try {
		const countAdmins = await User.countDocuments({ role: 'admin' });
		if (countAdmins === 0) {
			const passwordHash = await bcrypt.hash('admin123', 10);
			await User.create({ name: 'Admin', email: 'admin@makiti.local', passwordHash, role: 'admin', verified: true });
			console.log('Seeded default admin: admin@makiti.local / admin123');
		}
	} catch {}
})();
