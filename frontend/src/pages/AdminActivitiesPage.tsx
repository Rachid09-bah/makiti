import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search } from 'lucide-react';

interface ActivityItem {
  id: string;
  scope: 'user' | 'vendor' | 'system';
  action: string;
  user?: { id: string; name: string; email: string; role: string };
  role?: string;
  meta?: any;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminActivitiesPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/admin/activities', { params: { page, limit } });
      setItems(res.data.items);
      setTotal(res.data.total);
      setLimit(res.data.limit);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  const filtered = items.filter((it) => {
    const s = q.toLowerCase();
    return (
      it.action.toLowerCase().includes(s) ||
      (it.user?.email?.toLowerCase().includes(s) || it.user?.name?.toLowerCase().includes(s)) ||
      it.scope.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Activités</h1>
          <p>Journal des actions des utilisateurs et vendeurs</p>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input className="search-input" placeholder="Rechercher par action, email..." value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="search-icon"><Search size={14} /></span>
        </div>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Scope</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="error">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>Aucune activité</td></tr>
            ) : filtered.map((it) => (
              <tr key={it.id}>
                <td>{new Date(it.createdAt).toLocaleString('fr-FR')}</td>
                <td>
                  {it.user ? (
                    <div style={{ display:'grid' }}>
                      <span style={{ fontWeight: 600 }}>{it.user.name || it.user.email}</span>
                      <span style={{ color:'#64748b' }}>{it.user.email}</span>
                    </div>
                  ) : (
                    <em style={{ color:'#64748b' }}>Système</em>
                  )}
                </td>
                <td>{it.action}</td>
                <td>{it.scope}</td>
                <td>{it.ip || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Précédent</button>
        <div className="pagination-pages">
          <span className="pagination-page active">{page} / {totalPages}</span>
        </div>
        <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant →</button>
      </div>
    </div>
  );
}
