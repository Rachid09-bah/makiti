import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { trackAuthActivity } from '../middleware/activityTracker';

const router = Router();

// Route de déconnexion avec tracking
router.post('/logout', requireAuth, trackAuthActivity('logout'), (req, res) => {
  // Logique de déconnexion (invalidation de token côté client)
  res.json({ message: 'Déconnexion réussie' });
});

export default router;
