import { Router } from 'express';
import { z } from 'zod';

const supportRouter = Router();

const contactSchema = z.object({
	name: z.string().trim().min(1, 'Nom requis'),
	email: z.string().trim().email('Email invalide'),
	subject: z.string().trim().min(1, 'Sujet requis'),
	message: z.string().trim().min(10, 'Message trop court (min 10 caractères)'),
});

// Point d'entrée de contact public
supportRouter.post('/contact', async (req, res) => {
	const parsed = contactSchema.safeParse(req.body);
	if (!parsed.success) {
		const flat = parsed.error.flatten();
		const first = (parsed.error as any).issues?.[0]?.message || 'Données invalides';
		return res.status(400).json({ message: first, errors: flat });
	}
	const { name, email, subject, message } = parsed.data;
	try {
		// TODO: Persister en base ou envoyer un email. Pour l'instant, log serveur.
		console.log('[CONTACT]', { name, email, subject, message, at: new Date().toISOString() });
		return res.status(200).json({ ok: true, message: 'Message reçu. Nous vous répondons rapidement.' });
	} catch (err: any) {
		return res.status(500).json({ message: 'Erreur serveur' });
	}
});

export default supportRouter;
