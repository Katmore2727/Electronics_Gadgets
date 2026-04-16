import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getProducts } from '../api/productApi.js';
import Loader from '../components/common/Loader.jsx';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== 'admin') return;

    getProducts({ limit: 100 })
      .then(({ data }) => {
        setProducts(data.data || []);
      })
      .catch(() => {
        setProducts([]);
        toast.error('Failed to load products.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <Loader />;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Product Management</h1>
        <p className="text-slate-400 mt-2">View and manage all products</p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
          <p className="text-slate-400">No products yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr className="text-left text-slate-300">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 text-white font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-slate-400">{product.sku}</td>
                    <td className="px-6 py-4 text-cyan-400 font-medium">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {product.stock_quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <p className="text-sm text-slate-400">
          Product management (create/edit) can be done via API. Add forms here to extend the functionality.
        </p>
      </div>
    </div>
  );
}