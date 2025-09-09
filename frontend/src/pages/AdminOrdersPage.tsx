import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

interface OrderItem { productId: string; title: string; price: number; qty: number; }
interface OrderRow {
  id: string;
  customer?: { id: string; name: string; email: string };
  vendor?: { id: string; name: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  commissionAmount: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentRef?: string;
  deliveryAddress?: string;
  createdAt: string;
}

const STATUS = ['pending','paid','shipped','delivered','cancelled'] as const;
const PAY_STATUS = ['pending','paid','failed','refunded'] as const;

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState<string>('all');
  const [fPay, setFPay] = useState<string>('all');

  // Details state
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [edit, setEdit] = useState<{ status: OrderRow['status']; paymentStatus: OrderRow['paymentStatus']; paymentRef: string; deliveryAddress: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const params: any = { page, limit };
      if (q) params.q = q;
      if (fStatus !== 'all') params.status = fStatus;
      if (fPay !== 'all') params.paymentStatus = fPay;
      const res = await api.get('/admin/orders', { params });
      setRows(res.data.items);
      setTotal(res.data.total);
      setLimit(res.data.limit);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur de chargement des commandes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, fStatus, fPay]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) => {
      return (
        r.paymentRef?.toLowerCase().includes(s) ||
        r.deliveryAddress?.toLowerCase().includes(s) ||
        r.customer?.email?.toLowerCase().includes(s) ||
        r.customer?.name?.toLowerCase().includes(s) ||
        r.vendor?.name?.toLowerCase().includes(s)
      );
    });
  }, [rows, q]);

  function openDetails(r: OrderRow) {
    setSelected(r);
    setEdit({ status: r.status, paymentStatus: r.paymentStatus, paymentRef: r.paymentRef || '', deliveryAddress: r.deliveryAddress || '' });
  }

  async function saveDetails() {
    if (!selected || !edit) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await api.patch(`/admin/orders/${selected.id}`, {
        status: edit.status,
        paymentStatus: edit.paymentStatus,
        paymentRef: edit.paymentRef || undefined,
        deliveryAddress: edit.deliveryAddress || undefined
      });
      const updated = res.data;
      setRows((prev) => prev.map((r) => r.id === selected.id ? { ...r, status: updated.status, paymentStatus: updated.paymentStatus, paymentRef: updated.paymentRef, deliveryAddress: updated.deliveryAddress } : r));
      setSelected((prev) => prev ? { ...prev, status: updated.status, paymentStatus: updated.paymentStatus, paymentRef: updated.paymentRef, deliveryAddress: updated.deliveryAddress } : prev);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  }

  const currency = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Commandes</h1>
          <p>Suivi et mise à jour des commandes</p>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input className="search-input" placeholder="Rechercher (client, vendeur, adresse, réf. paiement)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="filters" style={{ display:'flex', gap:8 }}>
          <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1); }} className="filter-select">
            <option value="all">Tous statuts</option>
            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fPay} onChange={(e) => { setFPay(e.target.value); setPage(1); }} className="filter-select">
            <option value="all">Tous paiements</option>
            {PAY_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Vendeur</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="error">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>Aucune commande</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString('fr-FR')}</td>
                  <td>{r.customer ? (<div style={{ display:'grid' }}><strong>{r.customer.name}</strong><span style={{ color:'#64748b' }}>{r.customer.email}</span></div>) : '-'}</td>
                  <td>{r.vendor?.name || '-'}</td>
                  <td>{currency(r.total)}</td>
                  <td>{r.status}</td>
                  <td>{r.paymentStatus}</td>
                  <td className="actions"><button className="action-btn view" onClick={() => openDetails(r)}>Voir</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Précédent</button>
        <div className="pagination-pages"><span className="pagination-page active">{page} / {totalPages}</span></div>
        <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Suivant →</button>
      </div>

      {selected && edit ? (
        <div className="table-container" style={{ marginTop: 16, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Détails de la commande</h3>
          <div style={{ display:'grid', gap: 8, gridTemplateColumns:'1fr 1fr' }}>
            <div>
              <strong>Client:</strong> {selected.customer ? `${selected.customer.name} (${selected.customer.email})` : '-'}
            </div>
            <div>
              <strong>Vendeur:</strong> {selected.vendor?.name || '-'}
            </div>
            <div>
              <strong>Total:</strong> {currency(selected.total)} (Sous-total {currency(selected.subtotal)} + Liv. {currency(selected.deliveryFee)})
            </div>
            <div>
              <strong>Commission:</strong> {currency(selected.commissionAmount)}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>Articles</h4>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {selected.items.map((it, i) => (
                <li key={i}>{it.title} × {it.qty} — {currency(it.price)}</li>
              ))}
            </ul>
          </div>

          <div style={{ display:'grid', gap: 12, marginTop: 12, gridTemplateColumns:'repeat(2, minmax(0, 1fr))' }}>
            <div className="field">
              <label>Statut</label>
              <select className="filter-select" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as any })}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Statut de paiement</label>
              <select className="filter-select" value={edit.paymentStatus} onChange={(e) => setEdit({ ...edit, paymentStatus: e.target.value as any })}>
                {PAY_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Référence paiement</label>
              <input value={edit.paymentRef} onChange={(e) => setEdit({ ...edit, paymentRef: e.target.value })} placeholder="TRX-..." />
            </div>
            <div className="field" style={{ gridColumn:'auto / span 1' }}>
              <label>Adresse de livraison</label>
              <input value={edit.deliveryAddress} onChange={(e) => setEdit({ ...edit, deliveryAddress: e.target.value })} placeholder="Adresse..." />
            </div>
          </div>

          {saveError ? <div className="error" role="alert">{saveError}</div> : null}
          <div className="actions" style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary" onClick={saveDetails} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Fermer</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
