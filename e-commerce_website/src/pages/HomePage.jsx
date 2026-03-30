import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../api/productApi.js';
import ProductCard from '../components/product/ProductCard.jsx';
import Loader from '../components/common/Loader.jsx';

const getCategoryFallbackImage = (categoryName = 'Category') =>
  `https://placehold.co/200x200/4A90E2/FFFFFF?text=${encodeURIComponent(categoryName)}`;

const normalizeCategoryImageUrl = (imageUrl, categoryName) => {
  if (!imageUrl) {
    return getCategoryFallbackImage(categoryName);
  }

  return imageUrl.replace('https://via.placeholder.com', 'https://placehold.co');
};

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    // Load featured products
    getProducts({ limit: 8, status: 'active' })
      .then(({ data }) => setProducts(data.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    // Load categories
    getCategories()
      .then(({ data }) => setCategories(data.data.slice(0, 6))) // Show top 6 categories
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500/20 via-slate-950 to-slate-950" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            Premium Electronics
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mb-8">
            Discover the latest gadgets and tech essentials. Smartphones, laptops, accessories and more.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-3 bg-cyan-500 text-slate-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white mb-8">Shop by Category</h2>
        {categoriesLoading ? (
          <Loader />
        ) : categories.length === 0 ? (
          <p className="text-slate-400 text-center py-12">No categories available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="group bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all text-center"
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-slate-700">
                  <img
                    src={normalizeCategoryImageUrl(category.image_url, category.name)}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.src = getCategoryFallbackImage(category.name);
                    }}
                  />
                </div>
                <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white mb-8">Featured Products</h2>
        {loading ? (
          <Loader />
        ) : products.length === 0 ? (
          <p className="text-slate-400 text-center py-12">No products yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {!loading && products.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all products →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
