import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../store/user';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { User as UserIcon, LogOut, Settings, Mail, Phone as PhoneIcon, Menu, LayoutDashboard, ShoppingBag, Heart, MapPin, TicketPercent, Headphones } from 'lucide-react';

interface OrderItem { productId: string; title: string; price: number; qty: number; }
interface Order {
  _id: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | string;
  paymentStatus: 'pending' | 'paid' | 'failed' | string;
  items: OrderItem[];
  createdAt: string;
}

export default function AccountPage() {
  const user = useUser((s) => s.user);
  const logout = useUser((s) => s.logout);
  const navigate = useNavigate();
  const loc = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await api.get<Order[]>('/orders/me');
        if (mounted) setOrders(res.data || []);
      } catch {
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (user) fetchOrders();
    return () => { mounted = false; };
  }, [user]);

  function onLogout() {
    logout();
    navigate('/');
  }

  const active = (path: string) => (loc.pathname === path ? 'active' : undefined);

  const kpis = useMemo(() => {
    const total = orders.length;
    const awaitingPayment = orders.filter(o => o.paymentStatus === 'pending').length;
    const inProgress = orders.filter(o => ['paid', 'shipped'].includes(String(o.status))).length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    return { total, awaitingPayment, inProgress, delivered };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  if (!user) return null;

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <Menu size={18} />
          </button>
          <div className="admin-header-title">
            <h1>Mon espace</h1>
            <p>Bienvenue sur votre centre client</p>
          </div>
          <div className="admin-header-actions">
            <Link to="/account/profile" className="btn outline" title="Paramètres du profil"><Settings size={16} /></Link>
          </div>
        </div>
      </header>

      <div className="admin-container">
        <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="admin-nav">
            <Link to="/account" className={`nav-item ${active('/account')}`}>
              <span className="nav-icon"><LayoutDashboard size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Aperçu</span>}
            </Link>
            <Link to="/orders" className={`nav-item ${active('/orders')}`}>
              <span className="nav-icon"><ShoppingBag size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Mes commandes</span>}
            </Link>
            <Link to="#" className="nav-item" onClick={(e) => e.preventDefault()}>
              <span className="nav-icon"><Heart size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Favoris</span>}
            </Link>
            <Link to="#" className="nav-item" onClick={(e) => e.preventDefault()}>
              <span className="nav-icon"><MapPin size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Adresses</span>}
            </Link>
            <Link to="#" className="nav-item" onClick={(e) => e.preventDefault()}>
              <span className="nav-icon"><TicketPercent size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Coupons</span>}
            </Link>
            <Link to="#" className="nav-item" onClick={(e) => e.preventDefault()}>
              <span className="nav-icon"><Headphones size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Support</span>}
            </Link>
            <Link to="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="nav-item">
              <span className="nav-icon"><LogOut size={16} /></span>
              {!sidebarCollapsed && <span className="nav-label">Se déconnecter</span>}
            </Link>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-content" style={{ display: 'grid', gap: 16 }}>
            {/* Profil résumé */}
            <section className="upload-card" style={{ marginTop: 12 }}>
              <div className="avatar-preview" style={{ width: 72, height: 72 }}>
                {(user as any).photoUrl ? (
                  <img src={(user as any).photoUrl} alt={user.name} />
                ) : (
                  <div className="avatar-initials"><UserIcon size={18} /></div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'#64748b', fontSize:14 }}>
                  <Mail size={14} /> {user.email}
                </div>
                {(user as any).phone ? (
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'#64748b', fontSize:14 }}>
                    <PhoneIcon size={14} /> {(user as any).phone}
                  </div>
                ) : null}
                <div style={{ marginTop: 8 }}>
                  <Link to="/account/profile" className="btn outline small">Gérer mon profil</Link>
                </div>
              </div>
            </section>

            {/* KPIs */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
                <div style={{ color:'#64748b', fontSize:12 }}>Commandes</div>
                <div style={{ fontWeight:800, fontSize:22 }}>{kpis.total}</div>
                <div style={{ color:'#94a3b8', fontSize:12 }}>Total</div>
              </div>
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
                <div style={{ color:'#64748b', fontSize:12 }}>À payer</div>
                <div style={{ fontWeight:800, fontSize:22 }}>{kpis.awaitingPayment}</div>
                <div style={{ color:'#94a3b8', fontSize:12 }}>Paiement en attente</div>
              </div>
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
                <div style={{ color:'#64748b', fontSize:12 }}>En cours</div>
                <div style={{ fontWeight:800, fontSize:22 }}>{kpis.inProgress}</div>
                <div style={{ color:'#94a3b8', fontSize:12 }}>Prépa / Livraison</div>
              </div>
              <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
                <div style={{ color:'#64748b', fontSize:12 }}>Livrées</div>
                <div style={{ fontWeight:800, fontSize:22 }}>{kpis.delivered}</div>
                <div style={{ color:'#94a3b8', fontSize:12 }}>Complétées</div>
              </div>
            </section>

            {/* Commandes récentes */}
            <section style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
                <h2 style={{ margin:0, fontSize:16 }}>Commandes récentes</h2>
                <button className="btn outline small" onClick={() => navigate('/orders')}>Voir toutes les commandes</button>
              </div>
              {loading ? (
                <div style={{ color:'#64748b' }}>Chargement…</div>
              ) : recentOrders.length === 0 ? (
                <div style={{ color:'#64748b' }}>Aucune commande pour le moment.</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color:'#64748b', fontSize:12 }}>
                        <th style={{ padding:'8px 6px', borderBottom:'1px solid #e5e7eb' }}>N°</th>
                        <th style={{ padding:'8px 6px', borderBottom:'1px solid #e5e7eb' }}>Date</th>
                        <th style={{ padding:'8px 6px', borderBottom:'1px solid #e5e7eb' }}>Articles</th>
                        <th style={{ padding:'8px 6px', borderBottom:'1px solid #e5e7eb' }}>Total</th>
                        <th style={{ padding:'8px 6px', borderBottom:'1px solid #e5e7eb' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o._id}>
                          <td style={{ padding:'10px 6px', borderBottom:'1px solid #f1f5f9' }}>#{o._id.slice(-6).toUpperCase()}</td>
                          <td style={{ padding:'10px 6px', borderBottom:'1px solid #f1f5f9' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding:'10px 6px', borderBottom:'1px solid #f1f5f9', color:'#334155' }}>{o.items?.map(i => i.title).slice(0,2).join(', ')}{(o.items?.length||0) > 2 ? '…' : ''}</td>
                          <td style={{ padding:'10px 6px', borderBottom:'1px solid #f1f5f9', fontWeight:700 }}>{Intl.NumberFormat('fr-FR', { style:'currency', currency:'GNF' }).format(o.total || 0)}</td>
                          <td style={{ padding:'10px 6px', borderBottom:'1px solid #f1f5f9' }}>
                            <span style={{ fontSize:12, padding:'4px 8px', borderRadius:9999, border:'1px solid #e5e7eb', background:'#f8fafc' }}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Actions rapides */}
            <section style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
              <button className="btn outline" onClick={() => navigate('/account/profile')}><Settings size={16} />&nbsp;Paramètres du profil</button>
              <button className="btn outline" onClick={() => navigate('/orders')}><ShoppingBag size={16} />&nbsp;Mes commandes</button>
              <button className="btn danger" onClick={onLogout}><LogOut size={16} />&nbsp;Se déconnecter</button>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
