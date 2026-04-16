import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getProducts } from '../api/productApi.js';
import { getAdminOrders } from '../api/orderApi.js';
import Loader from '../components/common/Loader.jsx';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== 'admin') return;

    Promise.all([
      getProducts({ limit: 100 }),
      getAdminOrders({ limit: 100 }),
    ])
      .then(([productsResponse, ordersResponse]) => {
        const products = productsResponse.data.data || [];
        const orders = ordersResponse.data.data || [];

        const activeOrders = orders.filter((order) =>
          ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
        ).length;

        const totalRevenue = orders
          .filter(order => order.status === 'delivered')
          .reduce((sum, order) => sum + Number(order.total || 0), 0);

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          activeOrders,
          totalRevenue,
        });
      })
      .catch(() => {
        toast.error('Failed to load dashboard data.');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400 mt-2">Welcome to your admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Total Products</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.totalProducts}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Orders In Progress</p>
          <p className="text-2xl font-bold text-amber-300">{stats.activeOrders}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            to="/admin/orders"
            className="flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-center font-medium text-white hover:bg-cyan-700 transition-colors"
          >
            Manage Orders
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-center font-medium text-white hover:bg-cyan-700 transition-colors"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-center font-medium text-white hover:bg-cyan-700 transition-colors"
          >
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}
