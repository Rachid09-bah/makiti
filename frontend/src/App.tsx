 import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallback from './pages/OAuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './pages/AdminLayout';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminVendorsPage from './pages/AdminVendorsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import { useUser } from './store/user';
import { useCart } from './store/cart';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ContactPage from './pages/ContactPage';
import ProductCardDemo from './pages/ProductCardDemo';
import AboutPage from './pages/AboutPage';
import SearchBar from './components/SearchBar';

function UserAvatar() {
	const user = useUser((s) => s.user);
	if (!user) return null;
	const initials = user.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
	return (
		<Link to="/account" className="avatar" title={user.name}>
			{(user as any).photoUrl ? (
				<img src={(user as any).photoUrl} alt={user.name} />
			) : (
				<span className="initials">{initials || '?'}</span>
			)}
			<span>{user.name}</span>
		</Link>
	);
}

function App() {
	const user = useUser((s) => s.user);
	const cartCount = useCart((s) => s.items.reduce((acc, it) => acc + it.qty, 0));
	const [menuOpen, setMenuOpen] = useState(false);
	const logout = useUser((s) => s.logout);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [firstVisitChecked, setFirstVisitChecked] = useState(false);
	const [redirectHome, setRedirectHome] = useState(false);

	useEffect(() => {
		// Gestion du menu
		const close = () => setMenuOpen(false);
		const onClickOutside = (e: MouseEvent) => {
			if (!menuRef.current) return;
			if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
		};
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
		window.addEventListener('scroll', close, { passive: true });
		window.addEventListener('wheel', close, { passive: true });
		window.addEventListener('touchmove', close, { passive: true });
		window.addEventListener('resize', close);
		document.addEventListener('mousedown', onClickOutside);
		document.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('scroll', close);
			window.removeEventListener('wheel', close);
			window.removeEventListener('touchmove', close);
			window.removeEventListener('resize', close);
			document.removeEventListener('mousedown', onClickOutside);
			document.removeEventListener('keydown', onKey);
		};
	}, []);

	useEffect(() => {
		// Vérifie la première visite
		if (!firstVisitChecked) {
			const alreadyVisited = localStorage.getItem('makiti_already_visited');
			if (!alreadyVisited) {
				localStorage.setItem('makiti_already_visited', 'true');
				setRedirectHome(true);
			}
			setFirstVisitChecked(true);
		}
	}, [firstVisitChecked]);

	if (redirectHome) {
		setRedirectHome(false); // évite boucle infinie
		return <Navigate to="/" replace />;
	}

	return (
		<BrowserRouter>
			<ScrollToTop />
			<div>
				<header className="header">
					<div className="container">
						<Link to="/" className="brand">Makiti</Link>
						<SearchBar />
						<nav className="nav">
							<NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Accueil</NavLink>
							<NavLink to="/catalog" className={({ isActive }) => (isActive ? 'active' : '')}>Catalogue</NavLink>
							<NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')} title="Panier" aria-label="Panier" style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:6, background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:9999, padding:'6px 10px' }}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M3 3h2l.4 2M7 13h10l3-7H6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
									<circle cx="9" cy="21" r="1" fill="currentColor"/>
									<circle cx="20" cy="21" r="1" fill="currentColor"/>
								</svg>
								{cartCount > 0 ? (
									<span style={{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'#ffffff', borderRadius:9999, fontSize:10, lineHeight:'14px', minWidth:16, height:16, display:'grid', placeItems:'center', padding:'0 4px', border:'2px solid #ffffff' }}>{cartCount}</span>
								) : null}
							</NavLink>
							{user ? (
								<div style={{ position: 'relative', marginLeft: 'auto' }} ref={menuRef}>
								<button onClick={() => setMenuOpen(v => !v)} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '9999px', width: 36, height: 36, padding: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
										{(user as any).photoUrl ? (
											<img src={(user as any).photoUrl} alt={user.name} style={{ width: 32, height: 32, borderRadius: '9999px', objectFit: 'cover' }} />
										) : (
											<span className="initials" style={{ width: 32, height: 32, borderRadius: '9999px', display: 'grid', placeItems: 'center', background: '#f3f4f6', color: 'var(--ink)', fontWeight: 600, border: '1px solid #e5e7eb' }}>
												{user.name?.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() || '?'}
											</span>
										)}
									</button>
									{menuOpen && (
										<div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, minWidth: 220, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', zIndex: 50 }} onWheel={() => setMenuOpen(false)} onTouchMove={() => setMenuOpen(false)}>
											<div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{user.name}</div>
											{user.role === 'admin' && (
												<Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: 'var(--ink)', textDecoration: 'none' }}>Espace admin</Link>
											)}
											<Link to="/account" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 12px', color: 'var(--ink)', textDecoration: 'none' }}>Mon compte</Link>
											<button onClick={() => { logout(); setMenuOpen(false); toast.error('Déconnexion effectuée'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer' }}>Se déconnecter</button>
										</div>
									)}
								</div>
							) : (
								<>
									<Link to="/register" className="btn outline">S'inscrire</Link>
									<Link to="/login" className="btn">Se connecter</Link>
								</>
							)}
						</nav>
					</div>
				</header>
				<main>
					<div>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/catalog" element={<CatalogPage />} />
							<Route path="/product/:id" element={<ProductPage />} />
							<Route path="/cart" element={<CartPage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/oauth/callback" element={<OAuthCallback />} />
							<Route path="/forgot" element={<ForgotPasswordPage />} />
							<Route path="/reset-password" element={<ResetPasswordPage />} />
							<Route path="/register" element={<RegisterPage />} />
							<Route path="/contact" element={<ContactPage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/demo/product-card" element={<ProductCardDemo />} />
							<Route path="/account" element={<AccountPage />} />
							<Route path="/admin" element={user && user.role === 'admin' ? <AdminLayout /> : <Navigate to="/" replace />} >
								<Route index element={<AdminDashboard />} />
								<Route path="users" element={<AdminUsersPage />} />
								<Route path="vendors" element={<AdminVendorsPage />} />
								<Route path="products" element={<AdminProductsPage />} />
								<Route path="categories" element={<AdminCategoriesPage />} />
                                <Route path="orders" element={<AdminOrdersPage />} />
                                <Route path="settings" element={<AdminSettingsPage />} />
                                <Route path="analytics" element={<AdminAnalyticsPage />} />
							</Route>
							<Route path="/account/profile" element={<ProfilePage />} />
						</Routes>
					</div>
				</main>
				<footer className="site-footer">
				<div className="footer-container">
				<div className="footer-grid">
				<div className="footer-col">
				<div className="footer-brand">Makiti</div>
				<p className="footer-text">Marketplace guinéenne pour les produits locaux: Leppi, Bazin, artisanat, et plus.</p>
				</div>
				<div className="footer-col">
				<h4 className="footer-title">Découvrir</h4>
				<ul className="footer-links">
				<li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Accueil</Link></li>
				<li><Link to="/catalog">Catalogue</Link></li>
				<li><Link to="/cart">Panier</Link></li>
				<li><Link to="/register">Devenir vendeur</Link></li>
				<li><Link to="/login">Se connecter</Link></li>
				</ul>
				</div>
				<div className="footer-col">
				<h4 className="footer-title">Support</h4>
				<ul className="footer-links">
				<li><Link to="/about">À propos</Link></li>
				<li><a href="#">FAQ</a></li>
				<li><Link to="/contact">Contact</Link></li>
				<li><a href="#">Conditions d'utilisation</a></li>
				<li><a href="#">Confidentialité</a></li>
				</ul>
				</div>
				<div className="footer-col">
				<h4 className="footer-title">Contact</h4>
				<ul className="footer-links">
				<li>Conakry, Guinée</li>
				<li><a href="mailto:contact@makiti.local">contact@makiti.local</a></li>
				<li><a href="#">Facebook</a> • <a href="#">Instagram</a></li>
				</ul>
				</div>
				</div>
				<div className="footer-bottom">
				<p>© {new Date().getFullYear()} Makiti. Tous droits réservés.</p>
				</div>
				</div>
				</footer>
				</div>
				</BrowserRouter>
	);
}

// Composant pour remonter en haut à chaque changement de page
function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);

	return null;
}

export default App;
