import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AdminSocketData {
  userId: string;
  role: string;
  email: string;
}

export class SocketService {
  private io: SocketServer;
  private adminSockets = new Map<string, AdminSocketData>();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentification middleware pour les admins
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token manquant'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
          return next(new Error('Accès non autorisé - Admin requis'));
        }

        socket.data = {
          userId: user._id.toString(),
          role: user.role,
          email: user.email
        };

        next();
      } catch (error) {
        next(new Error('Token invalide'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const adminData: AdminSocketData = socket.data;
      
      // Stocker la connexion admin
      this.adminSockets.set(socket.id, adminData);
      
      console.log(`Admin connecté: ${adminData.email} (${socket.id})`);

      // Rejoindre la room admin
      socket.join('admin-room');

      // Envoyer les statistiques initiales
      this.sendInitialStats(socket);

      socket.on('disconnect', () => {
        this.adminSockets.delete(socket.id);
        console.log(`Admin déconnecté: ${adminData.email}`);
      });

      // Événement pour demander les activités récentes
      socket.on('get-recent-activities', async (data) => {
        try {
          const activities = await this.getRecentActivities(data.limit || 50);
          socket.emit('recent-activities', activities);
        } catch (error) {
          socket.emit('error', { message: 'Erreur lors de la récupération des activités' });
        }
      });
    });
  }

  // Diffuser une activité en temps réel à tous les admins connectés
  public broadcastActivity(activity: any) {
    this.io.to('admin-room').emit('new-activity', activity);
  }

  // Diffuser les statistiques mises à jour
  public broadcastStats(stats: any) {
    this.io.to('admin-room').emit('stats-update', stats);
  }

  // Envoyer les statistiques initiales à un admin qui se connecte
  private async sendInitialStats(socket: any) {
    try {
      const stats = await this.getCurrentStats();
      socket.emit('initial-stats', stats);
    } catch (error) {
      socket.emit('error', { message: 'Erreur lors de la récupération des statistiques' });
    }
  }

  // Récupérer les activités récentes
  private async getRecentActivities(limit: number = 50) {
    const { Activity } = await import('../models/Activity');
    return await Activity.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // Récupérer les statistiques actuelles
  private async getCurrentStats() {
    const { Activity } = await import('../models/Activity');
    const { User } = await import('../models/User');
    const { Order } = await import('../models/Order');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsersToday,
      totalOrders,
      ordersToday,
      recentLogins,
      recentLogouts
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Activity.countDocuments({
        action: { $in: ['auth.login', 'cart.add', 'order.create'] },
        createdAt: { $gte: today }
      }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Activity.countDocuments({
        action: 'auth.login',
        createdAt: { $gte: today }
      }),
      Activity.countDocuments({
        action: 'auth.logout',
        createdAt: { $gte: today }
      })
    ]);

    return {
      totalUsers,
      activeUsersToday,
      totalOrders,
      ordersToday,
      recentLogins,
      recentLogouts,
      connectedAdmins: this.adminSockets.size
    };
  }

  public getIO() {
    return this.io;
  }
}

export let socketService: SocketService;

export function initializeSocketService(server: HttpServer) {
  socketService = new SocketService(server);
  return socketService;
}
