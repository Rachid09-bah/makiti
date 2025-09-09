import { Router } from 'express';
import { sendMail } from '../utils/mailer';

const router = Router();

router.post('/send-mail', async (req, res) => {
  const { to, subject, html, text } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }
  try {
    await sendMail({ to, subject, html, text });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[MAIL ERROR]', error);
    res.status(500).json({ error: error?.message || 'Erreur lors de l\'envoi du mail.' });
  }
});

export default router;
