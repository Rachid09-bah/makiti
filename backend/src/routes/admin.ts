import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getRecentActivities,
  getDashboardStats,
  getOnlineUsers,
  getUserActivities,
  getActivitiesByType
} from '../controllers/adminController';

const router = Router();

// Toutes les routes admin nécessitent une authentification et le rôle admin
router.use(requireAuth);
router.use(requireRole('admin'));

// Dashboard - Statistiques générales
router.get('/dashboard/stats', getDashboardStats);

// Activités
router.get('/activities', getRecentActivities);
router.get('/activities/user/:userId', getUserActivities);
router.get('/activities/type/:type', getActivitiesByType);

// Utilisateurs en ligne
router.get('/users/online', getOnlineUsers);

export default router;
