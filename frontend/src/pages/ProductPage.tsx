import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../store/cart';
import { ShoppingCart, Star } from 'lucide-react';

interface Product {
  _id: string;
  title: string;
  price: number;
  images?: string[];
  description?: string;
  ratingAvg?: number;
  ratingCount?: number;
}

async function fetchProduct(id: string) {
  const res = await api.get(`/products/${id}`);
  return res.data as Product;
}

export default function ProductPage() {
  const { id } = useParams();
  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);
  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(String(id)),
    enabled: Boolean(id)
  });

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product._id, title: product.title, image: product.images?.[0], price: product.price, qty: 1 });
  };
  const alreadyInCart = !!items.find(it => it.id === product?._id);

  if (isLoading) return <div style={{ maxWidth: 1120, margin: '16px auto', padding: '0 16px' }}>Chargement...</div>;
  if (isError) return <div style={{ maxWidth: 1120, margin: '16px auto', padding: '0 16px' }}>Erreur: {(error as any)?.message || 'inconnue'}</div>;
  if (!product) return null;

  const r = Math.max(0, Math.min(5, Math.round((product.ratingAvg || 0))));

  return (
    <div style={{ maxWidth: 1120, margin: '16px auto', padding: '0 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: 360, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: 360, background: '#f8fafc', display: 'grid', placeItems: 'center', color: '#64748b' }}>Aucune image</div>
          )}
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <h1 style={{ margin: 0 }}>{product.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'inline-flex', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} style={{ color: i < r ? '#f59e0b' : '#e5e7eb' }} />
              ))}
            </div>
            <span style={{ color: '#64748b', fontSize: 13 }}>{product.ratingCount ? `(${product.ratingCount})` : 'Nouveau'}</span>
          </div>
          <div style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 20 }}>{formatPrice(product.price)}</div>
          <p style={{ margin: 0, color: '#475569' }}>{product.description || 'Aucune description fournie.'}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={handleAddToCart} disabled={alreadyInCart} title={alreadyInCart ? 'Déjà au panier' : 'Ajouter au panier'}>
              <ShoppingCart size={16} />&nbsp;{alreadyInCart ? 'Déjà au panier' : 'Ajouter au panier'}
            </button>
            <button className="btn outline">Négocier</button>
          </div>
        </div>
      </div>
    </div>
  );
}
