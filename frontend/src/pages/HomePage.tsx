import { Link } from 'react-router-dom';
import { Truck, CreditCard, Headphones } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../store/cart';

interface Product {
  _id: string;
  title: string;
  price: number;
  images?: string[];
}

async function fetchHomeProducts() {
  const [allRes, recRes] = await Promise.all([
    api.get('/products', { params: { limit: 16 } }),
    api.get('/products', { params: { limit: 8, recommended: true } })
  ]);
  const all = (allRes.data?.items || []) as Product[];
  const rec = (recRes.data?.items || []) as Product[];
  return { all, rec } as any;
}

export default function HomePage() {
  const categories = ['Leppi & Tenues traditionnelles', 'Bazin & Tissus', 'Chaussures', 'Artisanat & Décoration', 'Bijoux & Accessoires', 'Cosmétiques naturels', 'Épices & Agroalimentaire', 'Paniers & Vannerie'];

  const { data: dataObj, isLoading, isError } = useQuery({ queryKey: ['homeProducts'], queryFn: fetchHomeProducts });
  const products: Product[] = dataObj?.all || [];
  const recommendedApi: Product[] = dataObj?.rec || [];

  const addItem = useCart((s) => s.addItem);
  const cartItems = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const inCart = (id: string) => !!cartItems.find(it => it.id === id);
  const handleAdd = (p: Product) => addItem({ id: p._id, title: p.title, image: p.images?.[0], price: p.price, qty: 1 });

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;

  const topDeals = products.slice(0, 8);
  const recommended = (recommendedApi.length > 0 ? recommendedApi : products.slice(8, 16));

  return (
    <div className="home">
      {/* Hero section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <aside className="home-cats">
            <h3>Catégories</h3>
            <nav>
              {categories.map((c) => (
                <Link key={c} to="/catalog" className="home-cat-item">{c}</Link>
              ))}
            </nav>
          </aside>
          <div className="home-hero-main">
            <div className="home-hero-banner">
              <div className="home-hero-text">
                <h1>Découvrez les meilleurs produits locaux de Guinée</h1>
                <p>Leppi, Bazin, chaussures, artisanat, épices… Achetez directement auprès des vendeurs locaux.</p>
                <div className="home-hero-actions">
                  <Link to="/catalog" className="btn">Explorer le catalogue</Link>
                  <Link to="/register" className="btn outline">Devenir vendeur</Link>
                </div>
              </div>
            </div>
            <div className="home-hero-side">
              <div className="home-mini-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={18} /> <h4 style={{ margin: 0 }}>Livraison</h4>
                </div>
                <p>Rapide et sécurisée partout en Guinée</p>
              </div>
              <div className="home-mini-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} /> <h4 style={{ margin: 0 }}>Paiement</h4>
                </div>
                <p>Mobile Money et cash à la livraison</p>
              </div>
              <div className="home-mini-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Headphones size={18} /> <h4 style={{ margin: 0 }}>Support</h4>
                </div>
                <p>Assistance 7j/7 pour vos commandes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deals section */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>Offres du moment</h2>
          <Link to="/catalog" className="btn outline small">Tout voir</Link>
        </div>
        <div className="home-products-grid">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="home-product-card">
                <div className="home-product-media"><div className="home-product-placeholder">Chargement…</div></div>
                <div className="home-product-info">
                  <p className="title" style={{ background:'#f1f5f9', height:16, borderRadius:6 }} />
                  <p className="price" style={{ background:'#f1f5f9', height:14, width:'60%', borderRadius:6 }} />
                </div>
              </div>
            ))
          ) : isError ? (
            <div style={{ gridColumn: '1/-1', color:'#991b1b', background:'#fee2e2', border:'1px solid #fecaca', padding:12, borderRadius:10 }}>Impossible de charger les produits</div>
          ) : topDeals.length === 0 ? (
            <div style={{ gridColumn: '1/-1', color:'#64748b' }}>Aucun produit pour le moment.</div>
          ) : (
            topDeals.map(p => (
              <div key={p._id} className="home-product-card">
                <div className="home-product-media" style={{ position: 'relative' }}>
                  <span style={{ position:'absolute', top:8, left:8, background:'#16a34a', color:'#fff', fontSize:12, padding:'4px 6px', borderRadius:6 }}>Produit local</span>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} />
                  ) : (
                    <div className="home-product-placeholder">Aucune image</div>
                  )}
                </div>
                <div className="home-product-info">
                  <p className="title">{p.title}</p>
                  <p className="price">{formatPrice(p.price)}</p>
                </div>
                <div style={{ padding: 10 }}>
                  <button
                    className="btn small"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => (inCart(p._id) ? removeItem(p._id) : handleAdd(p))}
                    title={inCart(p._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                  >
                    {inCart(p._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recommended section */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>Recommandés pour vous</h2>
        </div>
        <div className="home-products-grid">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="home-product-card">
                <div className="home-product-media"><div className="home-product-placeholder">Chargement…</div></div>
                <div className="home-product-info">
                  <p className="title" style={{ background:'#f1f5f9', height:16, borderRadius:6 }} />
                  <p className="price" style={{ background:'#f1f5f9', height:14, width:'60%', borderRadius:6 }} />
                </div>
              </div>
            ))
          ) : isError ? (
            <div style={{ gridColumn: '1/-1', color:'#991b1b', background:'#fee2e2', border:'1px solid #fecaca', padding:12, borderRadius:10 }}>Impossible de charger les produits</div>
          ) : recommended.length === 0 ? (
            <div style={{ gridColumn: '1/-1', color:'#64748b' }}>Aucune recommandation pour le moment.</div>
          ) : (
            recommended.map(p => (
              <div key={p._id} className="home-product-card">
                <div className="home-product-media" style={{ position: 'relative' }}>
                  <span style={{ position:'absolute', top:8, left:8, background:'#16a34a', color:'#fff', fontSize:12, padding:'4px 6px', borderRadius:6 }}>Produit local</span>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} />
                  ) : (
                    <div className="home-product-placeholder">Aucune image</div>
                  )}
                </div>
                <div className="home-product-info">
                  <p className="title">{p.title}</p>
                  <p className="price">{formatPrice(p.price)}</p>
                </div>
                <div style={{ padding: 10 }}>
                  <button
                    className="btn small"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => (inCart(p._id) ? removeItem(p._id) : handleAdd(p))}
                    title={inCart(p._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                  >
                    {inCart(p._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
