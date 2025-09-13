export default function ProductSkeleton() {
  return (
    <div className="home-product-card animate-pulse">
      <div className="home-product-media bg-gray-200"></div>
      <div className="home-product-info">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div style={{ padding: 10 }}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}