import { z } from 'zod';

export const registerSchema = z.object({
	name: z.string().trim().min(1, 'Le nom est requis'),
	email: z.string().trim().email('Email invalide'),
	password: z.string().trim().min(6, 'Mot de passe trop court (min 6)'),
	phone: z.string().trim().optional()
});

export const loginSchema = z.object({
	email: z.string().trim().email(),
	password: z.string().trim().min(6)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
