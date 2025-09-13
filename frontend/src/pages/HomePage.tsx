import { Link } from 'react-router-dom';
import { Truck, CreditCard, Headphones, Menu, Shield, RotateCcw, Palette, Star, Phone, MessageCircle, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../store/cart';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductSkeleton from '../components/ProductSkeleton';
import { useState, useMemo, useEffect } from 'react';
import { useSearch } from '../store/search';

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

async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data as { _id: string; name: string; slug: string }[];
}

export default function HomePage() {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const [showCategories, setShowCategories] = useState(false);
  const { query } = useSearch();
  
  // Images du carrousel
  const bannerImages = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544117519-31a4b719223d?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582582621959-48d27397dc69?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop'
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Changement automatique d'image toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const { data: dataObj, isLoading, isError } = useQuery({ queryKey: ['homeProducts'], queryFn: fetchHomeProducts });
  const products: Product[] = dataObj?.all || [];
  const recommendedApi: Product[] = dataObj?.rec || [];

  const addItem = useCart((s) => s.addItem);
  const cartItems = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const inCart = (id: string) => !!cartItems.find(it => it.id === id);
  const handleAdd = (p: Product) => addItem({ id: p._id, title: p.title, image: p.images?.[0], price: p.price, qty: 1 });

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;

  // Filtrer les produits en temps réel
  const filteredTopDeals = useMemo(() => {
    const deals = products.slice(0, 8);
    if (!query.trim()) return deals;
    return deals.filter((p: Product) => 
      p.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);

  const filteredRecommended = useMemo(() => {
    const rec = (recommendedApi.length > 0 ? recommendedApi : products.slice(8, 16));
    if (!query.trim()) return rec;
    return rec.filter((p: Product) => 
      p.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, recommendedApi, query]);

  return (
    <div className="home">


      {/* Hero Banner */}
      <section className="relative min-h-[600px] flex items-center justify-center text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out" 
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("${bannerImages[currentImageIndex]}")`
          }}
        ></div>
        {/* Categories menu button */}
        <button 
          onClick={() => setShowCategories(!showCategories)}
          className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* Categories dropdown */}
        {showCategories && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowCategories(false)}
            ></div>
            <div className="absolute top-20 left-6 bg-white rounded-lg shadow-lg z-50 min-w-[250px] max-h-80 overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-[#181411]">Catégories</h3>
              </div>
              <nav className="p-2">
                {categories.map((c) => (
                  <Link 
                    key={c._id} 
                    to={`/catalog?category=${c._id}`} 
                    className="block px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-[#181411] text-sm"
                    onClick={() => setShowCategories(false)}
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </>
        )}

        <div className="relative z-10 flex flex-col gap-6 text-center max-w-4xl px-4">
          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Découvrez l'artisanat guinéen
          </h1>
          <p className="text-lg md:text-xl font-light">
            Des créations uniques, fabriquées avec passion et savoir-faire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button 
              onClick={() => {
                const productsSection = document.querySelector('.home-products-grid');
                if (productsSection) {
                  productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-[var(--brand)] text-white text-lg font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
            >
              <span className="truncate">Explorer nos collections</span>
            </button>
            <Link 
              to="/register"
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 border-2 border-white text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-white hover:text-[#181411] transition-all duration-300"
            >
              <span className="truncate">Devenir vendeur</span>
            </Link>
          </div>
        </div>
      </section>



      {/* Nouveautés section */}
      <section className="py-16 sm:py-24 px-4 sm:px-10 bg-[#fdfcfb]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#181411]">Nouveautés</h2>
            <p className="text-[#897261] text-lg mt-2">Les dernières créations de nos artisans</p>
          </div>
          <div className="home-products-grid">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            ) : isError ? (
              <div className="error-message">
                <div className="error-content">
                  <span>⚠️</span>
                  <p>Impossible de charger les produits</p>
                  <button onClick={() => window.location.reload()} className="btn small">Réessayer</button>
                </div>
              </div>
            ) : filteredTopDeals.length === 0 ? (
              <div className="empty-state">
                <span>📦</span>
                <p>Aucun produit pour le moment</p>
              </div>
            ) : (
              filteredTopDeals.map((p, index) => (
                <div key={p._id} className="home-product-card" style={{ animationDelay: `${index * 100}ms` }}>
                  <Link to={`/product/${p._id}`} className="home-product-media" style={{ position: 'relative', textDecoration: 'none' }}>
                    <span style={{ position:'absolute', top:8, left:8, background:'#16a34a', color:'#fff', fontSize:12, padding:'4px 6px', borderRadius:6 }}>Nouveau</span>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} />
                    ) : (
                      <div className="home-product-placeholder">Aucune image</div>
                    )}
                  </Link>
                  <div className="home-product-info">
                    <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <p className="title">{p.title}</p>
                    </Link>
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
        </div>
      </section>

      {/* Produits phares section */}
      <section className="py-16 sm:py-24 px-4 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[#181411] mb-12">Nos produits phares</h2>
          <div className="home-products-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            ) : isError ? (
              <div className="error-message">
                <div className="error-content">
                  <span>⚠️</span>
                  <p>Impossible de charger les recommandations</p>
                </div>
              </div>
            ) : filteredRecommended.length === 0 ? (
              <div className="empty-state">
                <span>✨</span>
                <p>Aucune recommandation pour le moment</p>
              </div>
            ) : (
              filteredRecommended.slice(0, 6).map((p, index) => (
                <div key={p._id} className="home-product-card" style={{ animationDelay: `${index * 100}ms` }}>
                  <Link to={`/product/${p._id}`} className="home-product-media" style={{ position: 'relative', textDecoration: 'none' }}>
                    <span style={{ position:'absolute', top:8, left:8, background:'#f59e0b', color:'#fff', fontSize:12, padding:'4px 6px', borderRadius:6 }}>Produit phare</span>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} />
                    ) : (
                      <div className="home-product-placeholder">Aucune image</div>
                    )}
                  </Link>
                  <div className="home-product-info">
                    <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <p className="title">{p.title}</p>
                    </Link>
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
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-10 bg-gradient-to-br from-[#fdfcfb] to-[#f8f6f3]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#181411] mb-4">Nos services</h2>
            <p className="text-[#897261] text-lg max-w-2xl mx-auto">Une expérience d'achat complète et sécurisée</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Paiement sécurisé */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[#ff9500] rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#181411] mb-4">Paiement sécurisé</h3>
              <p className="text-[#897261] mb-6">Payez en toute sécurité avec nos solutions de paiement fiables</p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
                  <div className="w-6 h-6 bg-[var(--brand)] rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">OM</span>
                  </div>
                  <span className="text-sm font-medium text-[#181411]">Orange Money</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">MM</span>
                  </div>
                  <span className="text-sm font-medium text-[#181411]">Mobile Money</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">💳</span>
                  </div>
                  <span className="text-sm font-medium text-[#181411]">Carte bancaire</span>
                </div>
              </div>
            </div>

            {/* Livraison rapide */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#181411] mb-4">Livraison rapide</h3>
              <p className="text-[#897261] mb-6">Recevez vos commandes rapidement partout en Guinée</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <span className="text-sm font-medium text-[#181411]">Conakry</span>
                  <span className="text-sm text-[var(--brand)] font-bold">24-48h</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <span className="text-sm font-medium text-[#181411]">Régions</span>
                  <span className="text-sm text-[var(--brand)] font-bold">3-5 jours</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <span className="text-sm font-medium text-[#181411]">Livraison gratuite</span>
                  <span className="text-sm text-green-600 font-bold">+50 000 GNF</span>
                </div>
              </div>
            </div>

            {/* Support client */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#181411] mb-4">Support client</h3>
              <p className="text-[#897261] mb-6">Une équipe dédiée pour vous accompagner dans vos achats</p>
              <div className="space-y-3">
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Phone className="w-5 h-5 text-[var(--brand)]" />
                    <span className="text-sm font-bold text-[#181411]">+224 XX XX XX XX</span>
                  </div>
                  <span className="text-xs text-[#897261]">Lun-Ven 8h-18h</span>
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MessageCircle className="w-5 h-5 text-[var(--brand)]" />
                    <span className="text-sm font-bold text-[#181411]">Chat en ligne</span>
                  </div>
                  <span className="text-xs text-[#897261]">Réponse immédiate</span>
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Mail className="w-5 h-5 text-[var(--brand)]" />
                    <span className="text-sm font-bold text-[#181411]">Email</span>
                  </div>
                  <span className="text-xs text-[#897261]">Réponse sous 24h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Garanties et avantages */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-[#181411] text-center mb-8">Nos garanties</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-[#181411] mb-2">Qualité garantie</h4>
                <p className="text-sm text-[#897261]">Produits authentiques certifiés</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-[#181411] mb-2">Retour gratuit</h4>
                <p className="text-sm text-[#897261]">14 jours pour changer d'avis</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-[#181411] mb-2">Fait main</h4>
                <p className="text-sm text-[#897261]">Artisanat 100% guinéen</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-[#181411] mb-2">Satisfaction</h4>
                <p className="text-sm text-[#897261]">Plus de 1000 clients satisfaits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#181411] mb-4">
            Prêt à explorer notre artisanat ?
          </h2>
          <p className="text-[#897261] text-lg mb-8">
            Parcourez nos collections et trouvez la pièce unique qui vous correspond.
          </p>
          <Link 
            to="/catalog"
            className="inline-flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-[var(--brand)] text-white text-lg font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
          >
            <span className="truncate">Voir toutes les collections</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
