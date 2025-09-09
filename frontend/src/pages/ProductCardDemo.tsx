import ProductCard from '../components/ProductCard';

const data = [
  {
    id: 'p1',
    image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?q=80&w=800&auto=format&fit=crop',
    badge: 'Nouveauté',
    title: 'Bazin riche brodé – Bleu & or',
    price: 150000,
  },
  {
    id: 'p2',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
    badge: 'Produit local',
    title: 'Leppi traditionnel – Rouge bordeaux',
    price: 98000,
  },
  {
    id: 'p3',
    image: 'https://images.unsplash.com/photo-1560243563-062b4b6b5a12?q=80&w=800&auto=format&fit=crop',
    badge: 'Promo',
    title: 'Sandales artisanales en cuir',
    price: 75000,
  },
];

export default function ProductCardDemo() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Demo ProductCard</h1>
      <p className="text-slate-600 mb-6">Exemple d\'utilisation du composant ProductCard avec 3 produits fictifs.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((p) => (
          <ProductCard
            key={p.id}
            image={p.image}
            badge={p.badge}
            title={p.title}
            price={p.price}
            actionLabel="Acheter maintenant"
            onAction={() => alert(`Acheter: ${p.title}`)}
          />
        ))}
      </div>
    </div>
  );
}
