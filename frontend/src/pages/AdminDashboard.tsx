import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Users, Store, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Plus, ClipboardList, Settings, User as UserIcon } from 'lucide-react';

export default function AdminDashboard() {
	// Insights enrichis via l'API admin
	type Series = { labels: string[]; data: number[] };
	type Insights = {
		totals: { users: number; vendors: number; products: number; orders: number };
		deltas: { users: number; vendors: number; products: number; orders: number };
		topVendors: { id: string; name: string; productsCount: number; createdAt?: string }[];
		latestProducts: { id: string; title: string; price: number; createdAt: string }[];
		recentActivities: { type: 'user'|'vendor'|'product'|'order'; label: string; at: string }[];
		series?: { usersDaily: Series; vendorsDaily: Series; productsDaily: Series; ordersDaily: Series; activitiesDaily: Series };
	};
	const { data: insights, isLoading, isError, error, refetch } = useQuery({
		queryKey: ['admin-insights'],
		queryFn: async () => {
			const res = await api.get('/admin/insights');
			return res.data as Insights;
		}
	});
	const nf = (n: number | undefined) => (n ?? 0).toLocaleString('fr-FR');
	const pf = (p: number | undefined) => {
		const v = Number(p ?? 0);
		const s = v > 0 ? '+' : '';
		return `${s}${v}%`;
	};
	const kpiData = [
		{ title: 'Utilisateurs', value: nf(insights?.totals.users), change: pf(insights?.deltas.users), trend: (insights?.deltas.users ?? 0) >= 0 ? 'up' : 'down', Icon: Users, color: 'blue' },
		{ title: 'Vendeurs', value: nf(insights?.totals.vendors), change: pf(insights?.deltas.vendors), trend: (insights?.deltas.vendors ?? 0) >= 0 ? 'up' : 'down', Icon: Store, color: 'green' },
		{ title: 'Produits', value: nf(insights?.totals.products), change: pf(insights?.deltas.products), trend: (insights?.deltas.products ?? 0) >= 0 ? 'up' : 'down', Icon: Package, color: 'purple' },
		{ title: 'Commandes', value: nf(insights?.totals.orders), change: pf(insights?.deltas.orders), trend: (insights?.deltas.orders ?? 0) >= 0 ? 'up' : 'down', Icon: ShoppingCart, color: 'orange' }
	];

	const recentActivities = (insights?.recentActivities || []);

	const quickActions = [
		{ title: 'Ajouter un produit', path: '/admin/products', Icon: Plus, color: 'green' },
		{ title: 'Gérer les commandes', path: '/admin/orders', Icon: ClipboardList, color: 'blue' },
		{ title: 'Voir les utilisateurs', path: '/admin/users', Icon: Users, color: 'purple' },
		{ title: 'Paramètres', path: '/admin/settings', Icon: Settings, color: 'gray' }
	];

	function Sparkline({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
		const w = 240, h = 60, p = 6;
		const max = Math.max(...data, 1);
		const min = Math.min(...data, 0);
		const range = Math.max(max - min, 1);
		const step = data.length > 1 ? (w - p * 2) / (data.length - 1) : 0;
		const points = data.map((v, i) => {
			const x = p + i * step;
			const y = h - p - ((v - min) / range) * (h - p * 2);
			return `${x},${y}`;
		}).join(' ');
		const last = data[data.length - 1] ?? 0;
		const first = data[0] ?? 0;
		const trendUp = last >= first;
		return (
			<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
				<polyline fill="none" stroke={color} strokeWidth={2} points={points} />
				<circle cx={p} cy={h - p - ((first - min) / range) * (h - p * 2)} r={2} fill={color} />
				<circle cx={p + (data.length - 1) * step} cy={h - p - ((last - min) / range) * (h - p * 2)} r={3} fill={trendUp ? '#16a34a' : '#dc2626'} />
			</svg>
		);
	}
	function hasNonZero(arr: number[] | undefined): boolean {
		if (!arr || arr.length === 0) return false;
		return arr.some((v) => Number(v) > 0);
	}

	return (
		<div className="admin-dashboard">
			{/* Header du dashboard */}
			<div className="dashboard-header">
				<div className="dashboard-title">
					<h1>Tableau de bord</h1>
					<p>Vue d'ensemble de votre plateforme</p>
				</div>
				<div className="dashboard-actions">
					<button className="btn btn-primary"><ClipboardList size={16} />&nbsp;Exporter rapport</button>
					<button className="btn btn-outline" onClick={() => refetch()} disabled={isLoading}>{isLoading ? 'Chargement...' : 'Actualiser'}</button>
				</div>
			</div>

			{/* KPI Cards */}
			{isError ? <div className="error" role="alert">{(error as any)?.message || 'Erreur de chargement des statistiques'}</div> : null}
			<div className="kpi-grid">
				{kpiData.map((kpi, index) => (
					<div key={index} className={`kpi-card kpi-${kpi.color}`}>
						<div className="kpi-header">
							<div className={`kpi-icon kpi-${kpi.color}`}>
								<kpi.Icon size={18} />
							</div>
							<div className={`kpi-trend kpi-trend-${kpi.trend}`}>
								{kpi.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />} {kpi.change}
							</div>
						</div>
						<div className="kpi-content">
							<h3 className="kpi-value">{kpi.value}</h3>
							<p className="kpi-title">{kpi.title}</p>
						</div>
					</div>
				))}
			</div>

			{/* Content Grid */}
			<div className="dashboard-content">
				{/* Analytics charts */}
				<div className="dashboard-section">
					<h2>Analytique (14 derniers jours)</h2>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
						<div className="chart-card">
							<h3>Utilisateurs / jour</h3>
							{isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.usersDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.usersDaily.data} color="#2563eb" />}
						</div>
						<div className="chart-card">
							<h3>Vendeurs / jour</h3>
							{isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.vendorsDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.vendorsDaily.data} color="#16a34a" />}
						</div>
						<div className="chart-card">
							<h3>Produits / jour</h3>
							{isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.productsDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.productsDaily.data} color="#7c3aed" />}
						</div>
						<div className="chart-card">
							<h3>Commandes / jour</h3>
							{isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.ordersDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.ordersDaily.data} color="#f59e0b" />}
						</div>
						<div className="chart-card" style={{ gridColumn: '1/-1' }}>
							<h3>Activités / jour</h3>
							{isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.activitiesDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.activitiesDaily.data} color="#dc2626" />}
						</div>
					</div>
				</div>
				{/* Quick Actions */}
				<div className="dashboard-section">
					<h2>Actions rapides</h2>
					<div className="quick-actions-grid">
						{quickActions.map((action, index) => (
							<Link key={index} to={action.path} className={`quick-action-card quick-action-${action.color}`}>
								<div className="quick-action-icon">{<action.Icon size={16} />}</div>
								<h3>{action.title}</h3>
							</Link>
						))}
					</div>
				</div>

				{/* Top vendors */}
				<div className="dashboard-section">
					<h2>Top vendeurs</h2>
					<div className="activities-list">
						{(insights?.topVendors || []).map((v, i) => (
							<div key={v.id} className="activity-item" style={{ gridTemplateColumns: '32px 1fr auto' }}>
								<div className="activity-icon"><Store size={16} /></div>
								<div className="activity-content">
									<p className="activity-action">{v.name}</p>
									<p className="activity-user">{v.productsCount} produits</p>
								</div>
								<span className="activity-time">{v.createdAt ? new Date(v.createdAt).toLocaleDateString('fr-FR') : ''}</span>
							</div>
						))}
					</div>
				</div>

				{/* Latest products */}
				<div className="dashboard-section">
					<h2>Derniers produits</h2>
					<div className="activities-list">
						{(insights?.latestProducts || []).map((p) => (
							<div key={p.id} className="activity-item" style={{ gridTemplateColumns: '32px 1fr auto' }}>
								<div className="activity-icon"><Package size={16} /></div>
								<div className="activity-content">
									<p className="activity-action">{p.title}</p>
									<p className="activity-user">{p.price.toLocaleString('fr-FR')} GNF</p>
								</div>
								<span className="activity-time">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
							</div>
						))}
					</div>
				</div>

				{/* Recent Activities */}
				<div className="dashboard-section">
					<h2>Activités récentes</h2>
					<div className="activities-list">
						{recentActivities.map((activity, index) => (
							<div key={index} className={`activity-item activity-${activity.type}`}>
								<div className="activity-icon">
									{activity.type === 'vendor' && <Store size={16} />}
									{activity.type === 'order' && <ShoppingCart size={16} />}
									{activity.type === 'product' && <Package size={16} />}
									{activity.type === 'user' && <UserIcon size={16} />}
								</div>
								<div className="activity-content">
									<p className="activity-action">{activity.type === 'order' ? 'Nouvelle commande' : activity.type === 'vendor' ? 'Nouveau vendeur' : activity.type === 'product' ? 'Nouveau produit' : 'Nouvel utilisateur'}</p>
									<p className="activity-user">{activity.label}</p>
								</div>
								<span className="activity-time">{new Date(activity.at).toLocaleDateString('fr-FR')}</span>
							</div>
						))}
					</div>
				</div>

				{/* Stats Summary */}
				<div className="dashboard-section">
					<h2>Résumé des statistiques</h2>
					<div className="stats-summary">
						<div className="stat-item">
							<h3>Chiffre d'affaires</h3>
							<p className="stat-value">€45,678</p>
							<p className="stat-period">Ce mois</p>
						</div>
						<div className="stat-item">
							<h3>Taux de conversion</h3>
							<p className="stat-value">3.2%</p>
							<p className="stat-period">Moyenne</p>
						</div>
						<div className="stat-item">
							<h3>Panier moyen</h3>
							<p className="stat-value">€67.50</p>
							<p className="stat-period">Ce mois</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
