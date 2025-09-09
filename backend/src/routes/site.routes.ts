import { Router } from 'express';
import { Setting } from '../models/Setting';

const siteRouter = Router();

// Public endpoint to fetch homepage hero image URL
siteRouter.get('/hero-image', async (_req, res) => {
  try {
    const doc = await Setting.findOne({ key: 'site.heroImage' });
    const url = (doc?.value as any)?.url || null;
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ message: 'Erreur serveur', error: err?.message });
  }
});

export default siteRouter;
