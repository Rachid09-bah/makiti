import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useCart } from '../store/cart';
import ProductCard from '../components/ProductCard';

interface Product {
  _id: string;
  title: string;
  price: number;
  images?: string[];
}

async function fetchProducts() {
  const res = await api.get('/products');
  return res.data as { items: Product[]; total: number };
}

export default function CatalogPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const addItem = useCart((s) => s.addItem);
  const cartItems = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);

  const [q, setQ] = useState('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sort, setSort] = useState<'new' | 'priceAsc' | 'priceDesc'>('new');

  const categories = [
    'Leppi & Tenues',
    'Bazin & Tissus',
    'Chaussures',
    'Artisanat & Décoration',
    'Bijoux & Accessoires',
    'Cosmétiques naturels',
    'Épices & Agroalimentaire',
    'Paniers & Vannerie'
  ];

  const items = data?.items || [];

  const filteredSorted = useMemo(() => {
    const min = priceMin ? Number(priceMin) : undefined;
    const max = priceMax ? Number(priceMax) : undefined;
    let arr = items.filter(p => {
      const matchQ = q ? p.title.toLowerCase().includes(q.toLowerCase()) : true;
      const matchMin = min != null ? p.price >= min : true;
      const matchMax = max != null ? p.price <= max : true;
      return matchQ && matchMin && matchMax;
    });
    if (sort === 'priceAsc') arr = arr.slice().sort((a,b) => a.price - b.price);
    if (sort === 'priceDesc') arr = arr.slice().sort((a,b) => b.price - a.price);
    return arr;
  }, [items, q, priceMin, priceMax, sort]);

  const inCart = (id: string) => !!cartItems.find(it => it.id === id);
  const handleAddToCart = (p: Product) => addItem({ id: p._id, title: p.title, image: p.images?.[0], price: p.price, qty: 1 });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Catalogue</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <aside className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 h-48" />
            <div className="bg-white rounded-xl border border-slate-200 h-56" />
          </aside>
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 h-14" />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="h-48 bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-4/5" />
                    <div className="h-4 bg-slate-100 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Catalogue</h1>
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">Erreur: {(error as any)?.message || 'inconnue'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Catalogue</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <aside className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <h3 className="font-semibold mb-2">Catégories</h3>
            <nav className="grid gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setQ(c)}
                  className="text-left bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-3 py-2 rounded-lg"
                >
                  {c}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><SlidersHorizontal size={16} /> Filtres</h3>
            <div className="grid gap-1">
              <label className="text-xs text-slate-500">Prix min</label>
              <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" className="px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-slate-500">Prix max</label>
              <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="1000000" className="px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <button className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-orange-500 text-orange-600 hover:bg-orange-50">
              Appliquer
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-3">
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="text-slate-500 text-sm">{filteredSorted.length} résultats</div>
            <div className="flex items-center gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche..." className="px-3 py-2 rounded-lg border border-slate-200 w-60 max-w-full" />
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="px-3 py-2 rounded-lg border border-slate-200">
                <option value="new">Plus récents</option>
                <option value="priceAsc">Prix: Bas → Élevé</option>
                <option value="priceDesc">Prix: Élevé → Bas</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredSorted.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4">Aucun produit trouvé.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSorted.map((p) => (
                <div key={p._id} className="space-y-2">
                  <ProductCard
                    image={p.images?.[0] || 'https://images.unsplash.com/photo-1544117519-31a4b719223d?q=80&w=1200&auto=format&fit=crop'}
                    badge="Produit local"
                    title={p.title}
                    price={p.price}
                    actionLabel={inCart(p._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                    onAction={() => (inCart(p._id) ? removeItem(p._id) : handleAddToCart(p))}
                  />
                  <Link to={`/product/${p._id}`} className="inline-flex justify-center w-full px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm">Voir plus</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
