import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories, getBrands } from '../api/productApi.js';
import ProductCard from '../components/product/ProductCard.jsx';
import Loader from '../components/common/Loader.jsx';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || searchParams.get('categoryId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brand: searchParams.get('brand') || '',
    status: 'active',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: parseInt(searchParams.get('page'), 10) || 1,
    limit: 20,
  };

  // Fetch categories and brands on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          getCategories(),
          getBrands(),
        ]);
        setCategories(catRes.data?.data || []);
        setBrands(brandRes.data?.data || []);
      } catch (error) {
        console.error('Failed to load filters:', error);
        toast.error('Failed to load filters');
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const params = Object.fromEntries(searchParams);
        const { data } = await getProducts({ ...params, status: 'active' });
        setProducts(data.data);
        setPagination(data.pagination || {});
      } catch (requestError) {
        setProducts([]);
        setPagination({});
        setError(requestError.response?.data?.message || 'Failed to load products');
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchParams]);

  const updateFilters = (updates, { resetPage = true } = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value == null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    if (resetPage) {
      nextParams.delete('page');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const updateFilter = (key, value) => {
    updateFilters({ [key]: value });
  };

  const resetFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Products</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 shrink-0 space-y-6 max-h-max sticky top-20">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                className="flex-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="flex-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Brand</label>
            <select
              value={filters.brand}
              onChange={(e) => updateFilter('brand', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 max-h-48"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                updateFilters({ sortBy, sortOrder });
              }}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="created_at-desc">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name A-Z</option>
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition duration-200"
          >
            Clear Filters
          </button>
        </aside>

        <div className="flex-1">
          {loading ? (
            <Loader />
          ) : error ? (
            <p className="text-center py-16 text-red-300">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-slate-400 text-center py-16">No products found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => updateFilters({ page: pagination.page - 1 }, { resetPage: false })}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => updateFilters({ page: pagination.page + 1 }, { resetPage: false })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
