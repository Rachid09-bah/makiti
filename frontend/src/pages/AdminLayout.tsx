import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../store/user';
import { Menu, Bell, User as UserIcon, LayoutDashboard, Users, Store, Package, ShoppingCart, LineChart, Settings, Tags } from 'lucide-react';

export default function AdminLayout() {
	const loc = useLocation();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const user = useUser((s) => s.user);
	
	const active = (path: string) => (loc.pathname === path ? 'active' : undefined);
	
	const navItems = [
		{ path: '/admin', label: 'Tableau de bord', Icon: LayoutDashboard },
		{ path: '/admin/users', label: 'Utilisateurs', Icon: Users },
		{ path: '/admin/vendors', label: 'Vendeurs', Icon: Store },
		{ path: '/admin/products', label: 'Produits', Icon: Package },
		{ path: '/admin/categories', label: 'Catégories', Icon: Tags },
		{ path: '/admin/orders', label: 'Commandes', Icon: ShoppingCart },
		{ path: '/admin/analytics', label: 'Analytics', Icon: LineChart },
		{ path: '/admin/settings', label: 'Paramètres', Icon: Settings }
	] as const;

	if (!user || user.role !== 'admin') {
		return <Navigate to="/" replace />;
	}

	return (
		<div className="admin-layout">
			{/* Header */}
			<header className="admin-header">
				<div className="admin-header-content">
					<button 
						className="sidebar-toggle"
						onClick={() => {
							const w = typeof window !== 'undefined' ? window.innerWidth : 0;
							if (w <= 1024) {
								setDrawerOpen(!drawerOpen);
							} else {
								setSidebarCollapsed(!sidebarCollapsed);
							}
						}}
						aria-expanded={drawerOpen}
						aria-controls="admin-sidebar"
					>
						<Menu size={18} />
					</button>
					<div className="admin-header-title">
						<h1>Administration Makiti</h1>
						<p>Gestion de la plateforme</p>
					</div>
					<div className="admin-header-actions">
					<button className="notification-btn"><Bell size={18} /></button>
					<Link to="/admin/settings" className="admin-profile">
					<div className="admin-avatar"><UserIcon size={16} /></div>
					<span>{user?.name || 'Admin'}</span>
					</Link>
					</div>
				</div>
			</header>

			<div className="admin-container">
				{/* Sidebar */}
				<aside id="admin-sidebar" className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${drawerOpen ? 'drawer-open' : ''}`}>
					<nav className="admin-nav">
						{navItems.map((item) => (
							<Link 
								key={item.path}
								to={item.path} 
								className={`nav-item ${active(item.path)}`}
								onClick={() => setDrawerOpen(false)}
							>
								<span className="nav-icon">{<item.Icon size={16} />}</span>
								{!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
							</Link>
						))}
					</nav>
					
					{!sidebarCollapsed && (
						<div className="sidebar-footer">
							<div className="sidebar-info">
								<p className="sidebar-version">v1.0.0</p>
								<p className="sidebar-status online">🟢 En ligne</p>
							</div>
						</div>
					)}
				</aside>

				{/* Mobile backdrop */}
				{drawerOpen ? <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" /> : null}

				{/* Main Content */}
				<main className="admin-main">
					<div className="admin-content">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
