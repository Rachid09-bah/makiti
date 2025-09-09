import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routes';
import path from 'path';

const app = express();

app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
const allowedOrigins = (process.env.CORS_ORIGIN || '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.length === 0) return callback(null, true);
			if (allowedOrigins.includes(origin)) return callback(null, true);
			return callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	})
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files (local storage fallback)
app.use('/uploads', (express as any).static(path.join(__dirname, 'uploads')));

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/v1', router);

export default app;
