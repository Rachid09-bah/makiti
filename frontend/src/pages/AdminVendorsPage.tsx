import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Store, CheckCircle2, Hourglass, XCircle, Search, Plus } from 'lucide-react';

type VendorStatus = 'pending' | 'approved' | 'rejected';

interface VendorItem {
  id: string;
  name: string;
  status: VendorStatus;
  location?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; phone?: string };
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    vendorName: '',
    userName: '',
    userEmail: '',
    password: '',
    phone: '',
    location: '',
    payoutMobileMoneyMsisdn: '',
    payoutMobileMoneyProvider: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<VendorItem[]>('/admin/vendors');
        if (mounted) setVendors(res.data);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(q.toLowerCase()) ||
    v.user.email.toLowerCase().includes(q.toLowerCase()) ||
    (v.location || '').toLowerCase().includes(q.toLowerCase())
  );

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const payload: any = {
        vendorName: form.vendorName,
        userName: form.userName,
        userEmail: form.userEmail,
        password: form.password,
      };
      if (form.phone) payload.phone = form.phone;
      if (form.location) payload.location = form.location;
      if (form.payoutMobileMoneyMsisdn || form.payoutMobileMoneyProvider) {
        payload.payoutMobileMoney = { msisdn: form.payoutMobileMoneyMsisdn, provider: form.payoutMobileMoneyProvider };
      }
      const res = await api.post('/admin/vendors', payload);
      setVendors(prev => [res.data as VendorItem, ...prev]);
      setShowCreate(false);
      setForm({ vendorName: '', userName: '', userEmail: '', password: '', phone: '', location: '', payoutMobileMoneyMsisdn: '', payoutMobileMoneyProvider: '' });
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Erreur lors de la création du vendeur');
    } finally {
      setCreateLoading(false);
    }
  }

  async function approveVendor(id: string) {
    setActionLoading(id);
    try {
      await api.patch(`/admin/vendors/${id}/approve`);
      setVendors(prev => prev.map(v => (v.id === id ? { ...v, status: 'approved' } : v)));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'approbation du vendeur');
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectVendor(id: string) {
    setActionLoading(id);
    try {
      await api.patch(`/admin/vendors/${id}/reject`);
      setVendors(prev => prev.map(v => (v.id === id ? { ...v, status: 'rejected' } : v)));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du rejet du vendeur');
    } finally {
      setActionLoading(null);
    }
  }

  const StatusPill = ({ s }: { s: VendorStatus }) => (
    <span className={`status-badge ${s === 'approved' ? 'status-active' : s === 'rejected' ? 'status-inactive' : 'status-pending'}`}>
      {s === 'approved' ? 'Approuvé' : s === 'rejected' ? 'Rejeté' : 'En attente'}
    </span>
  );

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Gestion des vendeurs</h1>
          <p>Créer et gérer les comptes vendeurs</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
            <Plus size={16} />&nbsp;{showCreate ? 'Fermer' : 'Ajouter un vendeur'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="table-container" style={{ padding: 16, marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Ajouter un vendeur</h3>
          <form onSubmit={onCreate} style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>Nom de la boutique</label>
              <input value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
            </div>
            <div className="field">
              <label>Nom du propriétaire</label>
              <input value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} />
            </div>
            <div className="field">
              <label>Email du propriétaire</label>
              <input type="email" value={form.userEmail} onChange={e => setForm({ ...form, userEmail: e.target.value })} />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Localisation</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="field">
              <label>Mobile Money (MSISDN)</label>
              <input value={form.payoutMobileMoneyMsisdn} onChange={e => setForm({ ...form, payoutMobileMoneyMsisdn: e.target.value })} />
            </div>
            <div className="field">
              <label>Fournisseur Mobile Money</label>
              <input value={form.payoutMobileMoneyProvider} onChange={e => setForm({ ...form, payoutMobileMoneyProvider: e.target.value })} />
            </div>
            {createError ? <div className="error" role="alert">{createError}</div> : null}
            <div className="actions">
              <button className="btn btn-primary" disabled={createLoading}>{createLoading ? 'Création...' : 'Créer le vendeur'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="filters-section">
        <div className="search-box">
          <input className="search-input" placeholder="Rechercher une boutique ou un propriétaire..." value={q} onChange={e => setQ(e.target.value)} />
          <span className="search-icon"><Search size={14} /></span>
        </div>
      </div>

      {/* List */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Boutique</th>
              <th>Statut</th>
              <th>Propriétaire</th>
              <th>Localisation</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="error">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>Aucun vendeur</td></tr>
            ) : filtered.map(v => (
              <tr key={v.id}>
                <td className="user-info">
                  <div className="user-avatar"><Store size={14} /></div>
                  <div className="user-details">
                    <p className="user-name">{v.name}</p>
                    <p className="user-email">{v.user.email}</p>
                  </div>
                </td>
                <td><StatusPill s={v.status} /></td>
                <td>{v.user.name}</td>
                <td>{v.location || '-'}</td>
                <td>{new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>
                  {v.status === 'pending' && (
                    <div className="actions">
                      <button
                        className="action-btn view"
                        onClick={() => approveVendor(v.id)}
                        disabled={actionLoading === v.id}
                        title="Approuver"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => rejectVendor(v.id)}
                        disabled={actionLoading === v.id}
                        title="Rejeter"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                  {v.status === 'approved' && (
                    <div className="actions">
                      <button className="action-btn view" disabled title="D��jà approuvé">
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => rejectVendor(v.id)}
                        disabled={actionLoading === v.id}
                        title="Rejeter"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                  {v.status === 'rejected' && (
                    <div className="actions">
                      <button
                        className="action-btn view"
                        onClick={() => approveVendor(v.id)}
                        disabled={actionLoading === v.id}
                        title="Approuver"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button className="action-btn delete" disabled title="Rejeté" >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
