import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Package, Search, Plus } from 'lucide-react';

interface VendorOption { id: string; name: string; }
interface ProductItem { id: string; vendorId: string; title: string; price: number; stock: number; status: string; isRecommended?: boolean; createdAt: string; categoryId?: string; }
interface Category { _id: string; name: string; slug: string; }



export default function AdminProductsPage() {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    vendorId: '',
    title: '',
    price: '',
    stock: '',
    description: '',
    tags: '',
    image: '',
    categoryId: '',
    local: false,
    isRecommended: false,
    status: 'active' as 'active' | 'inactive' | 'pending',
  });
  const [file, setFile] = useState<File | null>(null);

  // Edit form state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    vendorId: '',
    title: '',
    price: '',
    stock: '',
    description: '',
    tags: '',
    image: '',
    categoryId: '',
    local: false,
    isRecommended: false,
    status: 'active' as 'active' | 'inactive' | 'pending',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [vendorsRes, productsRes, categoriesRes] = await Promise.all([
          api.get<any[]>('/admin/vendors'),
          api.get<any[]>('/admin/products'),
          api.get<Category[]>('/categories'),
        ]);
        if (mounted) {
          setVendors(vendorsRes.data.map(v => ({ id: v.id || v._id, name: v.name })));
          setCategories(categoriesRes.data);
          setProducts(productsRes.data.map((p: any) => ({
            id: p.id || p._id,
            vendorId: String(p.vendorId),
            title: p.title,
            price: Number(p.price),
            stock: Number(p.stock),
            status: p.status,
            isRecommended: !!p.isRecommended,
            createdAt: p.createdAt,
            categoryId: p.categoryId,
          })));
        }
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || 'Erreur de chargement');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function onEdit(p: ProductItem) {
    setEditId(p.id);
    setEditError(null);
    setEditForm({
      vendorId: p.vendorId,
      title: p.title,
      price: String(p.price),
      stock: String(p.stock),
      description: '',
      tags: '',
      image: '',
      categoryId: '',
      local: false,
      status: (p.status as any) || 'active',
      isRecommended: !!p.isRecommended,
    });
    setEditFile(null);
  }

  async function onEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setEditError(null);
    setEditLoading(true);
    try {
      const fd = new FormData();
      if (editForm.vendorId) fd.append('vendorId', editForm.vendorId);
      if (editForm.title) fd.append('title', editForm.title);
      if (editForm.price) fd.append('price', String(Number(editForm.price)));
      if (editForm.stock) fd.append('stock', String(Number(editForm.stock)));
      if (editForm.description) fd.append('description', editForm.description);
      if (editForm.status) fd.append('status', editForm.status);
      fd.append('isRecommended', String(editForm.isRecommended));
      if (editForm.tags) fd.append('tags', editForm.tags);
      if (editForm.categoryId) fd.append('categoryId', editForm.categoryId);
      if (editFile) fd.append('image', editFile);
      if (!editFile && editForm.image) fd.append('image', editForm.image);
      const res = await api.patch(`/admin/products/${editId}`, fd);
      const updated = res.data as ProductItem;
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditId(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Erreur lors de la mise à jour du produit');
    } finally {
      setEditLoading(false);
    }
  }

  async function onDelete(p: ProductItem) {
    if (!window.confirm(`Supprimer le produit "${p.title}" ?`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      setProducts(prev => prev.filter(x => x.id !== p.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la suppression');
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const fd = new FormData();
      fd.append('vendorId', form.vendorId);
      fd.append('title', form.title);
      fd.append('price', String(Number(form.price)));
      fd.append('stock', String(Number(form.stock)));
      if (form.description) fd.append('description', form.description);
      if (form.status) fd.append('status', form.status);
      fd.append('isRecommended', String(form.isRecommended));
      if (form.tags) fd.append('tags', form.tags);
      if (form.categoryId) fd.append('categoryId', form.categoryId);
      if (file) fd.append('image', file);
      if (!file && form.image) fd.append('image', form.image); // fallback URL
      const res = await api.post('/admin/products', fd);
      setProducts(prev => [res.data as ProductItem, ...prev]);
      setShowCreate(false);
      setForm({ vendorId: '', title: '', price: '', stock: '', description: '', tags: '', image: '', categoryId: '', local: false, isRecommended: false, status: 'active' });
      setFile(null);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Erreur lors de la création du produit');
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Gestion des produits</h1>
          <p>Créer et gérer les produits (admin uniquement)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
            <Plus size={16} />&nbsp;{showCreate ? 'Fermer' : 'Ajouter un produit'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="table-container" style={{ padding: 16, marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Ajouter un produit</h3>
          <form onSubmit={onCreate} style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>Vendeur</label>
              <select className="filter-select" value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })}>
                <option value="">Sélectionner un vendeur</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Titre</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Prix</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="field">
              <label>Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="field">
              <label>Image (URL ou fichier)</label>
              <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="field">
              <label>Catégorie</label>
              <select className="filter-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sélectionner</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tags (séparés par des virgules)</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ex: bazin, leppi" />
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.local} onChange={e => setForm({ ...form, local: e.target.checked })} /> Produit local
            </label>
            <div className="field">
              <label>Recommandé</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.isRecommended} onChange={e => setForm({ ...form, isRecommended: e.target.checked })} /> Recommander ce produit
              </label>
            </div>
            <div className="field">
              <label>Statut</label>
              <select className="filter-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                <option value="active">Publié (visible)</option>
                <option value="pending">Brouillon (en attente)</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            {createError ? <div className="error" role="alert">{createError}</div> : null}
            <div className="actions">
              <button className="btn btn-primary" disabled={createLoading}>{createLoading ? 'Création...' : 'Créer le produit'}</button>
            </div>
          </form>
        </div>
      )}

      {editId && (
        <div className="table-container" style={{ padding: 16, marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Modifier le produit</h3>
          <form onSubmit={onEditSubmit} style={{ display: 'grid', gap: 12 }}>
            <div className="field">
              <label>Vendeur</label>
              <select className="filter-select" value={editForm.vendorId} onChange={e => setEditForm({ ...editForm, vendorId: e.target.value })}>
                <option value="">(inchangé)</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Titre</label>
              <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Prix</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
            </div>
            <div className="field">
              <label>Stock</label>
              <input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} />
            </div>
            <div className="field">
              <label>Image (URL ou fichier)</label>
              <input value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} placeholder="https://..." />
              <input type="file" accept="image/*" onChange={e => setEditFile(e.target.files?.[0] || null)} />
            </div>
            <div className="field">
              <label>Catégorie</label>
              <select className="filter-select" value={editForm.categoryId} onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}>
                <option value="">(inchangé)</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tags (séparés par des virgules)</label>
              <input value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} />
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={editForm.local} onChange={e => setEditForm({ ...editForm, local: e.target.checked })} /> Produit local
            </label>
            <div className="field">
              <label>Recommandé</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={editForm.isRecommended} onChange={e => setEditForm({ ...editForm, isRecommended: e.target.checked })} /> Recommander ce produit
              </label>
            </div>
            <div className="field">
              <label>Statut</label>
              <select className="filter-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}>
                <option value="active">Publié (visible)</option>
                <option value="pending">Brouillon (en attente)</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            {editError ? <div className="error" role="alert">{editError}</div> : null}
            <div className="actions" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" disabled={editLoading}>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditId(null)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input className="search-input" placeholder="Rechercher un produit..." value={q} onChange={e => setQ(e.target.value)} />
          <span className="search-icon"><Search size={14} /></span>
        </div>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Statut</th>
              <th>Recommandé</th>
              <th>Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="error">{error}</td></tr>
            ) : products.filter(p => p.title.toLowerCase().includes(q.toLowerCase())).length === 0 ? (
              <tr><td colSpan={7}>Aucun produit</td></tr>
            ) : products.filter(p => p.title.toLowerCase().includes(q.toLowerCase())).map(p => (
              <tr key={p.id}>
                <td className="user-info">
                  <div className="user-avatar"><Package size={14} /></div>
                  <div className="user-details">
                    <p className="user-name">{p.title}</p>
                    <p className="user-email">#{p.vendorId}</p>
                  </div>
                </td>
                <td>{p.price.toFixed(2)} €</td>
                <td>{p.stock}</td>
                <td>{p.status}</td>
                <td>{p.isRecommended ? 'Oui' : 'Non'}</td>
                <td>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="actions">
                  <button className="action-btn edit" onClick={() => onEdit(p)}>Modifier</button>
                  <button className="action-btn delete" onClick={() => onDelete(p)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
