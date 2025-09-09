import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, CheckCircle2, Store, Hourglass, Search, Pencil, Eye, Trash2 } from 'lucide-react';

type BackendRole = 'admin' | 'vendor' | 'customer';
type UiRole = 'admin' | 'vendeur' | 'client';
type UiStatus = 'active' | 'inactive' | 'pending';

interface AdminUser {
	_id: string;
	name: string;
	email: string;
	role: BackendRole;
	phone?: string;
	createdAt: string;
	verified?: boolean;
}

export default function AdminUsersPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRole, setSelectedRole] = useState<'all' | UiRole>('all');
	const [selectedStatus, setSelectedStatus] = useState<'all' | UiStatus>('all');
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Create form state
	const [createOpen, setCreateOpen] = useState(false);
	const [createData, setCreateData] = useState({ name: '', email: '', role: 'customer' as BackendRole, phone: '', password: '', verified: false });
	const [createLoading, setCreateLoading] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	// Edit form state
	const [editUser, setEditUser] = useState<AdminUser | null>(null);
	const [editData, setEditData] = useState({ name: '', email: '', role: 'customer' as BackendRole, phone: '', verified: false });
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await api.get<AdminUser[]>('/admin/users');
				if (mounted) setUsers(res.data);
			} catch (err: any) {
				if (mounted) setError(err?.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	function mapBackendRoleToUiRole(role: BackendRole): UiRole {
		if (role === 'vendor') return 'vendeur';
		if (role === 'customer') return 'client';
		return 'admin';
	}

	function computeStatus(u: AdminUser): UiStatus {
		return u.verified ? 'active' : 'pending';
	}

	async function handleCreateSubmit(e: React.FormEvent) {
		e.preventDefault();
		setCreateError(null);
		setCreateLoading(true);
		try {
			const payload: any = { ...createData };
			if (!payload.phone) delete payload.phone;
			const res = await api.post('/admin/users', payload);
			const created = res.data as any;
			const newUser: AdminUser = {
				_id: created.id,
				name: created.name,
				email: created.email,
				role: created.role,
				phone: created.phone,
				createdAt: created.createdAt,
				verified: created.verified,
			};
			setUsers(prev => [newUser, ...prev]);
			setCreateData({ name: '', email: '', role: 'customer', phone: '', password: '', verified: false });
			setCreateOpen(false);
		} catch (err: any) {
			setCreateError(err?.response?.data?.message || 'Erreur lors de la création');
		} finally {
			setCreateLoading(false);
		}
	}

	function openEdit(u: AdminUser) {
		setEditUser(u);
		setEditData({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', verified: !!u.verified });
	}

	async function handleEditSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!editUser) return;
		setEditError(null);
		setEditLoading(true);
		try {
			const payload: any = { ...editData };
			if (payload.phone === '') payload.phone = undefined;
			const res = await api.patch(`/admin/users/${editUser._id}`, payload);
			const updated = res.data as any;
			setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone, verified: updated.verified } : u));
			setEditUser(null);
		} catch (err: any) {
			setEditError(err?.response?.data?.message || 'Erreur lors de la mise à jour');
		} finally {
			setEditLoading(false);
		}
	}

	async function handleDelete(u: AdminUser) {
		if (!window.confirm(`Supprimer ${u.name} ?`)) return;
		try {
			await api.delete(`/admin/users/${u._id}`);
			setUsers(prev => prev.filter(x => x._id !== u._id));
		} catch (err: any) {
			alert(err?.response?.data?.message || 'Erreur lors de la suppression');
		}
	}

	const filteredUsers = users.filter((user) => {
		const roleUi = mapBackendRoleToUiRole(user.role);
		const statusUi = computeStatus(user);
		const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesRole = selectedRole === 'all' || roleUi === selectedRole;
		const matchesStatus = selectedStatus === 'all' || statusUi === selectedStatus;
		return matchesSearch && matchesRole && matchesStatus;
	});

	const getStatusBadge = (status: UiStatus) => {
		const statusConfig = {
			active: { label: 'Actif', class: 'status-active' },
			inactive: { label: 'Inactif', class: 'status-inactive' },
			pending: { label: 'En attente', class: 'status-pending' }
		};
		const config = statusConfig[status];
		return <span className={`status-badge ${config.class}`}>{config.label}</span>;
	};

	const getRoleBadge = (role: UiRole) => {
		const roleConfig = {
			client: { label: 'Client', class: 'role-client' },
			vendeur: { label: 'Vendeur', class: 'role-vendeur' },
			admin: { label: 'Admin', class: 'role-admin' }
		};
		const config = roleConfig[role];
		return <span className={`role-badge ${config.class}`}>{config.label}</span>;
	};

	return (
		<div className="admin-users-page">
			{/* Header */}
			<div className="page-header">
				<div className="page-title">
					<h1>Gestion des utilisateurs</h1>
					<p>Gérez tous les utilisateurs de votre plateforme</p>
				</div>
				<div className="page-actions">
					<button className="btn btn-primary" onClick={() => setCreateOpen(v => !v)}>{createOpen ? 'Fermer' : '➕ Ajouter un utilisateur'}</button>
					<button className="btn btn-outline">📊 Exporter</button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="stats-cards">
				<div className="stat-card">
					<div className="stat-icon"><Users size={16} /></div>
					<div className="stat-content">
						<h3>{users.length}</h3>
						<p>Total utilisateurs</p>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><CheckCircle2 size={16} /></div>
					<div className="stat-content">
						<h3>{users.filter(u => computeStatus(u) === 'active').length}</h3>
						<p>Utilisateurs actifs</p>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><Store size={16} /></div>
					<div className="stat-content">
						<h3>{users.filter(u => mapBackendRoleToUiRole(u.role) === 'vendeur').length}</h3>
						<p>Vendeurs</p>
					</div>
				</div>
				<div className="stat-card">
					<div className="stat-icon"><Hourglass size={16} /></div>
					<div className="stat-content">
						<h3>{users.filter(u => computeStatus(u) === 'pending').length}</h3>
						<p>En attente</p>
					</div>
				</div>
			</div>

			{/* Create / Edit Forms */}
			{createOpen && (
				<div className="table-container" style={{ padding: 16, marginTop: 12 }}>
					<h3 style={{ marginTop: 0 }}>Ajouter un utilisateur</h3>
					<form onSubmit={handleCreateSubmit} style={{ display: 'grid', gap: 12 }}>
						<div className="field">
							<label>Nom</label>
							<input value={createData.name} onChange={e => setCreateData({ ...createData, name: e.target.value })} />
						</div>
						<div className="field">
							<label>Email</label>
							<input type="email" value={createData.email} onChange={e => setCreateData({ ...createData, email: e.target.value })} />
						</div>
						<div className="field">
							<label>Rôle</label>
							<select value={createData.role} onChange={e => setCreateData({ ...createData, role: e.target.value as BackendRole })} className="filter-select">
								<option value="customer">Client</option>
								<option value="vendor">Vendeur</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<div className="field">
							<label>Téléphone</label>
							<input value={createData.phone} onChange={e => setCreateData({ ...createData, phone: e.target.value })} />
						</div>
						<div className="field">
							<label>Mot de passe</label>
							<input type="password" value={createData.password} onChange={e => setCreateData({ ...createData, password: e.target.value })} />
						</div>
						<label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
							<input type="checkbox" checked={createData.verified} onChange={e => setCreateData({ ...createData, verified: e.target.checked })} />
							Vérifié
						</label>
						{createError ? <div className="error" role="alert">{createError}</div> : null}
						<div className="actions">
							<button className="btn btn-primary" disabled={createLoading}>{createLoading ? 'Création...' : 'Créer'}</button>
						</div>
					</form>
				</div>
			)}
			{editUser && (
				<div className="table-container" style={{ padding: 16, marginTop: 12 }}>
					<h3 style={{ marginTop: 0 }}>Modifier l'utilisateur</h3>
					<form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: 12 }}>
						<div className="field">
							<label>Nom</label>
							<input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
						</div>
						<div className="field">
							<label>Email</label>
							<input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
						</div>
						<div className="field">
							<label>Rôle</label>
							<select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value as BackendRole })} className="filter-select">
								<option value="customer">Client</option>
								<option value="vendor">Vendeur</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<div className="field">
							<label>Téléphone</label>
							<input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
						</div>
						<label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
							<input type="checkbox" checked={editData.verified} onChange={e => setEditData({ ...editData, verified: e.target.checked })} />
							Vérifié
						</label>
						{editError ? <div className="error" role="alert">{editError}</div> : null}
						<div className="actions" style={{ display: 'flex', gap: 8 }}>
							<button className="btn btn-primary" disabled={editLoading}>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
							<button type="button" className="btn btn-outline" onClick={() => setEditUser(null)}>Annuler</button>
						</div>
					</form>
				</div>
			)}

			{/* Filters and Search */}
			<div className="filters-section">
				<div className="search-box">
					<input
						type="text"
						placeholder="Rechercher un utilisateur..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="search-input"
					/>
					<span className="search-icon"><Search size={14} /></span>
				</div>
				
				<div className="filters">
					<select 
						value={selectedRole} 
						onChange={(e) => setSelectedRole(e.target.value as 'all' | UiRole)}
						className="filter-select"
					>
						<option value="all">Tous les rôles</option>
						<option value="client">Client</option>
						<option value="vendeur">Vendeur</option>
						<option value="admin">Admin</option>
					</select>
					
					<select 
						value={selectedStatus} 
						onChange={(e) => setSelectedStatus(e.target.value as 'all' | UiStatus)}
						className="filter-select"
					>
						<option value="all">Tous les statuts</option>
						<option value="active">Actif</option>
						<option value="inactive">Inactif</option>
						<option value="pending">En attente</option>
					</select>
				</div>
			</div>

			{/* Users Table */}
			<div className="table-container">
				<table className="users-table">
					<thead>
						<tr>
							<th>Utilisateur</th>
							<th>Rôle</th>
							<th>Statut</th>
							<th>Date d'inscription</th>
							<th>Dernière connexion</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr><td colSpan={6}>Chargement...</td></tr>
						) : error ? (
							<tr><td colSpan={6} className="error">{error}</td></tr>
						) : filteredUsers.length === 0 ? (
							<tr><td colSpan={6}>Aucun utilisateur</td></tr>
						) : filteredUsers.map(user => (
							<tr key={user._id}>
								<td className="user-info">
									<div className="user-avatar">
										{user.name?.charAt(0) || '?'}
									</div>
									<div className="user-details">
										<p className="user-name">{user.name}</p>
										<p className="user-email">{user.email}</p>
									</div>
								</td>
								<td>{getRoleBadge(mapBackendRoleToUiRole(user.role))}</td>
								<td>{getStatusBadge(computeStatus(user))}</td>
								<td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
								<td>-</td>
								<td className="actions">
									<button className="action-btn edit" onClick={() => openEdit(user)}><Pencil size={14} /></button>
									<button className="action-btn view"><Eye size={14} /></button>
									<button className="action-btn delete" onClick={() => handleDelete(user)}><Trash2 size={14} /></button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="pagination">
				<button className="pagination-btn">← Précédent</button>
				<div className="pagination-pages">
					<button className="pagination-page active">1</button>
					<button className="pagination-page">2</button>
					<button className="pagination-page">3</button>
				</div>
				<button className="pagination-btn">Suivant →</button>
			</div>
		</div>
	);
}
