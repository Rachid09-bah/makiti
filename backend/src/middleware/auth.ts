import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthRole = 'admin' | 'vendor' | 'customer';

export interface AuthUser {
	id: string;
	role: AuthRole;
	email?: string;
}

declare module 'express-serve-static-core' {
	interface Request {
		user?: AuthUser;
	}
}

const getJwtSecret = (): string => {
	const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
	return secret;
};

export const attachUserFromJWT = (req: Request, _res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return next();
	}
	const token = authHeader.substring('Bearer '.length);
	try {
		const payload = jwt.verify(token, getJwtSecret()) as AuthUser & { iat: number; exp: number };
		req.user = { id: payload.id, role: payload.role, email: payload.email };
	} catch {
		// ignore invalid token; downstream can enforce auth
	}
	return next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
	if (!req.user) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
	next();
};

export const requireRole = (role: AuthRole | AuthRole[]) => {
	const allowed = Array.isArray(role) ? role : [role];
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
		next();
	};
};
