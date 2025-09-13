import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useCart } from '../store/cart';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductSkeleton from '../components/ProductSkeleton';
import { useSearch } from '../store/search';


interface Product {
  _id: string;
  title: string;
  price: number;
  images?: string[];
  categoryId?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

async function fetchProducts(categoryId?: string) {
  const params = categoryId ? { categoryId } : {};
  const res = await api.get('/products', { params });
  return res.data as { items: Product[]; total: number };
}

async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data as Category[];
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [q, setQ] = useState('');
  const { query: globalQuery } = useSearch();
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sort, setSort] = useState<'new' | 'priceAsc' | 'priceDesc'>('new');

  // Lire les paramètres depuis l'URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const queryFromUrl = searchParams.get('q');
    if (categoryFromUrl) {
      setSelectedCategoryId(categoryFromUrl);
    }
    if (queryFromUrl) {
      setQ(queryFromUrl);
    }
  }, [searchParams]);

  // Filtrer par lettre
  const letterFilter = searchParams.get('letter');

  const { data, isLoading, isError, error } = useQuery({ 
    queryKey: ['products', selectedCategoryId], 
    queryFn: () => fetchProducts(selectedCategoryId || undefined)
  });
  
  const { data: categories = [] } = useQuery({ 
    queryKey: ['categories'], 
    queryFn: fetchCategories 
  });

  const addItem = useCart((s) => s.addItem);
  const cartItems = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);

  const items = data?.items || [];

  const filteredSorted = useMemo(() => {
    const min = priceMin ? Number(priceMin) : undefined;
    const max = priceMax ? Number(priceMax) : undefined;
    const searchQuery = globalQuery || q; // Utiliser la recherche globale en priorité
    let arr = items.filter(p => {
      const matchQ = searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      const matchMin = min != null ? p.price >= min : true;
      const matchMax = max != null ? p.price <= max : true;
      const matchLetter = letterFilter ? p.title.toLowerCase().startsWith(letterFilter.toLowerCase()) : true;
      return matchQ && matchMin && matchMax && matchLetter;
    });
    if (sort === 'priceAsc') arr = arr.slice().sort((a,b) => a.price - b.price);
    if (sort === 'priceDesc') arr = arr.slice().sort((a,b) => b.price - a.price);
    return arr;
  }, [items, q, globalQuery, priceMin, priceMax, sort, letterFilter]);

  const inCart = (id: string) => !!cartItems.find(it => it.id === id);
  const handleAddToCart = (p: Product) => addItem({ id: p._id, title: p.title, image: p.images?.[0], price: p.price, qty: 1 });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[400px] space-y-4 flex-col">
          <LoadingSpinner size="lg" />
          <p className="text-slate-600">Chargement du catalogue...</p>
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
              <button
                onClick={() => setSelectedCategoryId('')}
                className={`text-left border px-3 py-2 rounded-lg ${
                  selectedCategoryId === '' 
                    ? 'bg-orange-50 border-orange-200 text-orange-800' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategoryId(c._id)}
                  className={`text-left border px-3 py-2 rounded-lg ${
                    selectedCategoryId === c._id 
                      ? 'bg-orange-50 border-orange-200 text-orange-800' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {c.name}
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
                  <Link to={`/product/${p._id}`} style={{ textDecoration: 'none' }}>
                    <ProductCard
                      image={p.images?.[0] || 'https://images.unsplash.com/photo-1544117519-31a4b719223d?q=80&w=1200&auto=format&fit=crop'}
                      badge="Produit local"
                      title={p.title}
                      price={p.price}
                      actionLabel={inCart(p._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                      onAction={(e) => {
                        e?.preventDefault();
                        e?.stopPropagation();
                        inCart(p._id) ? removeItem(p._id) : handleAddToCart(p);
                      }}
                    />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
