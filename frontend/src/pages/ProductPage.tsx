import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCart } from '../store/cart';
import { Heart, ShoppingBag } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Product {
  _id: string;
  title: string;
  price: number;
  images?: string[];
  description?: string;
  stock: number;
  categoryId?: string;
}

async function fetchProduct(id: string) {
  const res = await api.get(`/products/${id}`);
  return res.data as Product;
}

async function fetchSimilarProducts() {
  const res = await api.get('/products', { params: { limit: 3 } });
  return res.data?.items || [];
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

  const { data: similarProducts = [] } = useQuery({
    queryKey: ['similarProducts'],
    queryFn: fetchSimilarProducts
  });

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} GNF`;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product._id, title: product.title, image: product.images?.[0], price: product.price, qty: 1 });
  };

  const alreadyInCart = !!items.find(it => it.id === product?._id);

  if (isLoading) {
    return (
      <main className="flex-1 px-40 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-stone-600">Chargement du produit...</p>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="flex-1 px-40 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center text-red-600">
            Erreur: {(error as any)?.message || 'Produit introuvable'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-20 lg:px-40 py-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-stone-500">
          <Link className="hover:text-stone-800" to="/catalog">Produits</Link>
          <span className="mx-2">/</span>
          <span className="text-stone-800">{product.title}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 gap-6 md:gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div className="overflow-hidden rounded-2xl">
            {product.images?.[0] ? (
              <img 
                alt={product.title} 
                className="h-full w-full object-cover" 
                src={product.images[0]}
              />
            ) : (
              <div className="h-96 w-full bg-stone-200 flex items-center justify-center rounded-2xl">
                <span className="text-stone-500">Aucune image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {product.title}
            </h1>
            
            <p className="mt-4 text-lg text-stone-600">
              {product.description || 'Aucune description disponible pour ce produit.'}
            </p>
            
            <p className="mt-6 text-3xl font-bold text-stone-900">
              {formatPrice(product.price)}
            </p>

            {product.stock > 0 && (
              <p className="mt-2 text-sm text-green-600">
                En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
              </p>
            )}

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={alreadyInCart || product.stock === 0}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 flex-1 bg-[var(--brand)] text-white text-lg font-bold leading-normal tracking-wide shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="mr-2" size={20} />
                <span className="truncate">
                  {alreadyInCart ? 'Déjà au panier' : product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                </span>
              </button>
              
              <button className="flex items-center justify-center rounded-full p-3 border border-stone-300 hover:bg-stone-100 transition-colors">
                <Heart size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <div className="mt-12 md:mt-24">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900">Produits similaires</h2>
          <div className="mt-6 md:mt-8 grid grid-cols-2 gap-4 md:gap-x-6 md:gap-y-10 lg:grid-cols-3 xl:gap-x-8">
            {similarProducts.slice(0, 3).map((similarProduct: any) => (
              <div key={similarProduct._id} className="group relative flex flex-col">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-stone-200 xl:aspect-h-8 xl:aspect-w-7">
                  {similarProduct.images?.[0] ? (
                    <img 
                      alt={similarProduct.title} 
                      className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity" 
                      src={similarProduct.images[0]}
                    />
                  ) : (
                    <div className="h-full w-full bg-stone-200 flex items-center justify-center">
                      <span className="text-stone-500 text-sm">Aucune image</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-base text-stone-800 font-medium">
                      <Link to={`/product/${similarProduct._id}`}>
                        <span aria-hidden="true" className="absolute inset-0"></span>
                        {similarProduct.title}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-base font-medium text-stone-900">
                    {formatPrice(similarProduct.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}