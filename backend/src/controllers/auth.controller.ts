import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { loginSchema, registerSchema } from '../dto/auth.dto';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { sendMail, getAppWebUrl } from '../utils/mailer';

const getJwtSecret = (): string => {
	const s = process.env.JWT_SECRET || 'dev_secret_change_me';
	return s;
};

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

export const register = async (req: Request, res: Response) => {
	const body: any = (req as any).body || {};
	const payload = {
		name: typeof body.name === 'string' ? body.name : '',
		email: typeof body.email === 'string' ? body.email : '',
		password: typeof body.password === 'string' ? body.password : '',
		phone: typeof body.phone === 'string' ? body.phone : undefined,
	};
	const parsed = registerSchema.safeParse(payload);
	if (!parsed.success) {
		const flat = parsed.error.flatten();
		const messages = [
			...(flat.fieldErrors.name || []),
			...(flat.fieldErrors.email || []),
			...(flat.fieldErrors.password || []),
			...(flat.fieldErrors.phone || []),
		];
		return res.status(400).json({ message: messages[0] || 'Invalid form data', errors: flat });
	}
	const data = parsed.data as any;
	if (data.phone === '' || data.phone === 'undefined') data.phone = undefined;
	const exists = await User.findOne({ email: data.email });
	if (exists) return res.status(409).json({ message: 'Email already in use' });
	let photoUrl: string | undefined;
	if (req.file) {
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
			// Fallback: save locally and expose via /uploads
			const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
			await fs.promises.mkdir(uploadsDir, { recursive: true });
			const file = req.file as Express.Multer.File;
			const safeName = `${Date.now()}-${(file.originalname || 'avatar').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
			const destPath = path.join(uploadsDir, safeName);
			await fs.promises.writeFile(destPath, file.buffer);
			const baseUrl = `${req.protocol}://${req.get('host')}`;
			photoUrl = `${baseUrl}/uploads/avatars/${safeName}`;
		}
	}
	const passwordHash = await bcrypt.hash(data.password, 10);
	const user = await User.create({ name: data.name, email: data.email, phone: data.phone, passwordHash, role: 'customer', photoUrl });
	const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: '1h' });
	return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, photoUrl: user.photoUrl }, token });
};

export const login = async (req: Request, res: Response) => {
	const parsed = loginSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
	const { email, password } = parsed.data;
	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ message: 'Invalid credentials' });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
	const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, getJwtSecret(), { expiresIn: '1h' });
	return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, photoUrl: user.photoUrl }, token });
};

export const forgotPassword = async (req: Request, res: Response) => {
    const email = String((req.body?.email || '')).toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email requis' });
    const user = await User.findOne({ email });
    if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        user.passwordResetTokenHash = tokenHash;
        user.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min
        await user.save();
        try {
            const appUrl = getAppWebUrl();
            const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
            const html = `
                <p>Bonjour${user.name ? ' ' + user.name : ''},</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                <p>Veuillez cliquer sur le lien ci-dessous (valide 15 minutes) :</p>
                <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
                <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
            `;
            await sendMail({ to: email, subject: 'Réinitialisation du mot de passe', html, text: `Ouvrez ce lien pour réinitialiser votre mot de passe: ${resetUrl}` });
        } catch {}
        if (process.env.NODE_ENV !== 'production') {
            return res.json({ message: 'Si un compte correspond, un email a été envoyé', devToken: token });
        }
    }
    return res.json({ message: 'Si un compte correspond, un email a été envoyé' });
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token, password } = req.body || {};
    if (!token || !password || String(password).length < 6) {
        return res.status(400).json({ message: 'Données invalides' });
    }
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Lien invalide ou expiré' });
    user.passwordHash = await bcrypt.hash(String(password), 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Mot de passe réinitialisé' });
};