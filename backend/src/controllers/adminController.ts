import { Request, Response } from 'express';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Product } from '../models/Product';

// Récupérer les activités récentes avec pagination
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const activities = await Activity.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Activity.countDocuments();

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des activités' });
  }
};

// Récupérer les statistiques du dashboard admin
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Statistiques générales
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalOrders,
      totalProducts,
      activeUsersToday,
      ordersToday,
      revenueToday
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Order.countDocuments(),
      Product.countDocuments(),
      Activity.distinct('userId', {
        createdAt: { $gte: today },
        action: { $in: ['auth.login', 'cart.add', 'order.create'] }
      }).then(users => users.length),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    // Activités par type aujourd'hui
    const activitiesStats = await Activity.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Tendances (comparaison avec hier)
    const [
      activeUsersYesterday,
      ordersYesterday
    ] = await Promise.all([
      Activity.distinct('userId', {
        createdAt: { $gte: yesterday, $lt: today },
        action: { $in: ['auth.login', 'cart.add', 'order.create'] }
      }).then(users => users.length),
      Order.countDocuments({ createdAt: { $gte: yesterday, $lt: today } })
    ]);

    // Activités récentes par heure (dernières 24h)
    const hourlyActivities = await Activity.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalCustomers,
        totalVendors,
        totalOrders,
        totalProducts,
        activeUsersToday,
        ordersToday,
        revenueToday
      },
      trends: {
        activeUsers: {
          today: activeUsersToday,
          yesterday: activeUsersYesterday,
          change: activeUsersYesterday > 0 ? ((activeUsersToday - activeUsersYesterday) / activeUsersYesterday * 100) : 0
        },
        orders: {
          today: ordersToday,
          yesterday: ordersYesterday,
          change: ordersYesterday > 0 ? ((ordersToday - ordersYesterday) / ordersYesterday * 100) : 0
        }
      },
      activitiesStats,
      hourlyActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

// Récupérer les utilisateurs en ligne (basé sur l'activité récente)
export const getOnlineUsers = async (req: Request, res: Response) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineUserIds = await Activity.distinct('userId', {
      createdAt: { $gte: fiveMinutesAgo }
    });

    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds },
      role: { $ne: 'admin' }
    }).select('name email role createdAt').lean();

    // Récupérer la dernière activité de chaque utilisateur
    const usersWithLastActivity = await Promise.all(
      onlineUsers.map(async (user) => {
        const lastActivity = await Activity.findOne({
          userId: user._id
        }).sort({ createdAt: -1 }).lean();

        return {
          ...user,
          lastActivity: lastActivity?.action,
          lastSeen: lastActivity?.createdAt
        };
      })
    );

    res.json({
      count: onlineUsers.length,
      users: usersWithLastActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs en ligne' });
  }
};

// Récupérer les activités par utilisateur
export const getUserActivities = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Activity.countDocuments({ userId });

    const user = await User.findById(userId).select('name email role').lean();

    res.json({
      user,
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des activités utilisateur' });
  }
};

// Récupérer les activités par type
export const getActivitiesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ action: new RegExp(type, 'i') })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Activity.countDocuments({ action: new RegExp(type, 'i') });

    res.json({
      type,
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des activités par type' });
  }
};
