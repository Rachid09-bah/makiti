import { Request, Response, NextFunction } from 'express';
import { recordActivity, ActivityRole } from '../models/Activity';
import { socketService } from '../services/socketService';
import { AuthUser } from './auth';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Middleware pour tracker les connexions/déconnexions
export const trackAuthActivity = (action: 'login' | 'logout') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Vérifier si la réponse est un succès
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Enregistrer l'activité de manière asynchrone
          setImmediate(async () => {
            try {
              const userId = req.user?.id || (action === 'login' && JSON.parse(data)?.user?.id);
              const role = req.user?.role || (action === 'login' && JSON.parse(data)?.user?.role) as ActivityRole;
              
              if (userId) {
                const activity = await recordActivity({
                  userId,
                  role,
                  scope: 'user',
                  action: `auth.${action}`,
                  meta: {
                    email: req.user?.email || (action === 'login' && JSON.parse(data)?.user?.email),
                    timestamp: new Date().toISOString()
                  },
                  req
                });

                // Diffuser l'activité en temps réel aux admins
                if (socketService) {
                  socketService.broadcastActivity({
                    ...activity.toObject(),
                    user: {
                      name: JSON.parse(data)?.user?.name || 'Utilisateur',
                      email: req.user?.email || JSON.parse(data)?.user?.email,
                      role: role
                    }
                  });
                }
              }
            } catch (error) {
              console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
            }
          });
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Middleware pour tracker les ajouts au panier
export const trackCartActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        setImmediate(async () => {
          try {
            const activity = await recordActivity({
              userId: req.user!.id,
              role: req.user!.role as ActivityRole,
              scope: 'user',
              action: 'cart.add',
              meta: {
                productId: req.body.productId,
                quantity: req.body.quantity || 1,
                timestamp: new Date().toISOString()
              },
              req
            });

            if (socketService) {
              socketService.broadcastActivity({
                ...activity.toObject(),
                user: {
                  email: req.user!.email,
                  role: req.user!.role
                }
              });
            }
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'activité panier:', error);
          }
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    next();
  }
};

// Middleware pour tracker les commandes
export const trackOrderActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        setImmediate(async () => {
          try {
            const orderData = JSON.parse(data);
            const activity = await recordActivity({
              userId: req.user!.id,
              role: req.user!.role as ActivityRole,
              scope: 'user',
              action: 'order.create',
              meta: {
                orderId: orderData.order?._id || orderData._id,
                total: orderData.order?.total || orderData.total,
                itemsCount: orderData.order?.items?.length || orderData.items?.length,
                timestamp: new Date().toISOString()
              },
              req
            });

            if (socketService) {
              socketService.broadcastActivity({
                ...activity.toObject(),
                user: {
                  email: req.user!.email,
                  role: req.user!.role
                }
              });

              // Mettre à jour les statistiques
              socketService.broadcastStats({
                type: 'new_order',
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'activité commande:', error);
          }
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    next();
  }
};

// Middleware général pour tracker les activités des produits
export const trackProductActivity = (action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
          setImmediate(async () => {
            try {
              const activity = await recordActivity({
                userId: req.user!.id,
                role: req.user!.role as ActivityRole,
                scope: req.user!.role === 'vendor' ? 'vendor' : 'user',
                action: `product.${action}`,
                meta: {
                  productId: req.params.id || req.body.productId,
                  timestamp: new Date().toISOString()
                },
                req
              });

              if (socketService) {
                socketService.broadcastActivity({
                  ...activity.toObject(),
                  user: {
                    email: req.user!.email,
                    role: req.user!.role
                  }
                });
              }
            } catch (error) {
              console.error('Erreur lors de l\'enregistrement de l\'activité produit:', error);
            }
          });
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
