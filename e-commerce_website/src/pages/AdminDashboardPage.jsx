import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getProducts } from '../api/productApi.js';
import { getAdminOrders, updateOrderStatus } from '../api/orderApi.js';
import Loader from '../components/common/Loader.jsx';

const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const statusStyles = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  confirmed: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  processing: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    Promise.all([getProducts({ limit: 50 }), getAdminOrders({ limit: 30 })])
      .then(([productsResponse, ordersResponse]) => {
        setProducts(productsResponse.data.data || []);
        setOrders(ordersResponse.data.data || []);
      })
      .catch(() => {
        setProducts([]);
        setOrders([]);
        toast.error('Failed to load admin dashboard data.');
      })
      .finally(() => {
        setLoading(false);
        setOrdersLoading(false);
      });
  }, [authLoading, user, navigate]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId);

    try {
      const { data } = await updateOrderStatus(orderId, { status });
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...data.data,
              }
            : order
        )
      );
      toast.success(`Order moved to ${status}.`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not update the order status.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (authLoading) {
    return <Loader />;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  const activeOrders = orders.filter((order) =>
    ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Total Products</p>
          <p className="text-2xl font-bold text-cyan-400">{products.length}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <p className="text-sm text-slate-400">Orders In Progress</p>
          <p className="text-2xl font-bold text-amber-300">{activeOrders}</p>
        </div>
      </div>

      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Order Management</h2>
          <p className="text-sm text-slate-400">
            Confirm, pack, ship, and complete customer orders from here.
          </p>
        </div>

        {ordersLoading ? (
          <Loader />
        ) : orders.length === 0 ? (
          <p className="text-slate-400">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const leadItem = order.lead_item || {};
              const customerName = [order.first_name, order.last_name]
                .filter(Boolean)
                .join(' ');
              const paymentMethod =
                order.billing_address?.paymentMethod || 'cod';
              const nextStatuses =
                ORDER_STATUS_TRANSITIONS[order.status] || [];

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-800 p-2">
                        {leadItem.images?.[0] ? (
                          <img
                            src={leadItem.images[0]}
                            alt={leadItem.name || 'Ordered product'}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {order.order_number}
                          </h3>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                              statusStyles[order.status] ||
                              'border-slate-600 bg-slate-700 text-slate-200'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-base font-medium text-slate-100">
                          {leadItem.name || 'Order items'}
                          {Number(order.item_count || 0) > 1
                            ? ` +${Number(order.item_count) - 1} more`
                            : ''}
                        </p>

                        <p className="text-sm text-slate-400">
                          {leadItem.brand || 'Brand unavailable'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                          <span>{formatDateTime(order.created_at)}</span>
                          <span>{formatCurrency(order.total)}</span>
                          <span className="capitalize">
                            {paymentMethod.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">
                          Customer: {customerName || 'Unknown customer'}
                          {order.email ? ` | ${order.email}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-200">
                        Update order status
                      </label>
                      {nextStatuses.length > 0 ? (
                        <select
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                          defaultValue=""
                          disabled={updatingOrderId === order.id}
                          onChange={(event) => {
                            const nextStatus = event.target.value;
                            if (!nextStatus) {
                              return;
                            }

                            handleStatusChange(order.id, nextStatus);
                            event.target.value = '';
                          }}
                        >
                          <option value="" disabled>
                            Choose next status
                          </option>
                          {nextStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400">
                          No further status updates allowed
                        </div>
                      )}
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        {order.status === 'cancelled'
                          ? 'This order was cancelled by the customer or admin and cannot move forward.'
                          : order.status === 'delivered'
                            ? 'This order is complete. No further status updates are needed.'
                            : 'Only the next valid production step is shown here.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">
          Recent Products
        </h2>
        {loading ? (
          <Loader />
        ) : products.length === 0 ? (
          <p className="text-slate-400">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-400">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800">
                    <td className="py-3 text-white">{product.name}</td>
                    <td className="py-3 text-slate-400">{product.sku}</td>
                    <td className="py-3 text-cyan-400">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="py-3 text-slate-400">
                      {product.stock_quantity}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          product.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
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
        )}
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Product management (create/edit) can be done via API. Add a form here
        to extend the dashboard.
      </p>
    </div>
  );
}
