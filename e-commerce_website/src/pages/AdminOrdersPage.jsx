import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
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

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== 'admin') return;

    getAdminOrders({ limit: 50 })
      .then(({ data }) => {
        setOrders(data.data || []);
      })
      .catch(() => {
        setOrders([]);
        toast.error('Failed to load orders.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, user]);

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

  if (authLoading || loading) {
    return <Loader />;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Order Management</h1>
        <p className="text-slate-400 mt-2">Confirm, pack, ship, and complete customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
          <p className="text-slate-400">No orders yet.</p>
        </div>
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

                    {/* Status History */}
                    {order.status_history && order.status_history.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-600">
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Status History</h5>
                        <div className="space-y-1">
                          {order.status_history.map((history, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 capitalize">{history.status}</span>
                              <span className="text-slate-500">
                                {new Date(history.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}