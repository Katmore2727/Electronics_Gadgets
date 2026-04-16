import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  CreditCard,
  IndianRupee,
  MapPinHouse,
  PackageCheck,
  ShieldAlert,
  Truck,
  Wallet,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { cancelOrder, getOrder, getOrderHistory } from '../api/orderApi.js';
import Loader from '../components/common/Loader.jsx';
import Button from '../components/common/Button.jsx';
import OrderTracking from '../components/common/OrderTracking.jsx';

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Need to change address or payment method',
  'Want to change product or quantity',
];

const STATUS_META = {
  pending: {
    label: 'Pending',
    pill: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: Wallet,
    timeline: [
      { key: 'placed', title: 'Order placed', description: 'Your order has been placed successfully.' },
      { key: 'pending', title: 'Awaiting seller confirmation', description: 'We are waiting for the seller to approve this order before packing begins.' },
    ],
  },
  confirmed: {
    label: 'Confirmed',
    pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: PackageCheck,
    timeline: [
      { key: 'placed', title: 'Order placed', description: 'Your order has been placed successfully.' },
      { key: 'confirmed', title: 'Order confirmed', description: 'Seller has confirmed your order and started preparation.' },
    ],
  },
  processing: {
    label: 'Processing',
    pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: PackageCheck,
    timeline: [
      { key: 'placed', title: 'Order placed', description: 'Your order has been placed successfully.' },
      { key: 'confirmed', title: 'Order confirmed', description: 'Seller has confirmed your order and started preparation.' },
      { key: 'processing', title: 'Processing', description: 'Your items are being packed and prepared for shipment.' },
    ],
  },
  shipped: {
    label: 'Shipped',
    pill: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    icon: Truck,
    timeline: [
      { key: 'placed', title: 'Order placed', description: 'Your order has been placed successfully.' },
      { key: 'confirmed', title: 'Order confirmed', description: 'Seller has confirmed your order and started preparation.' },
      { key: 'processing', title: 'Packed', description: 'Your package has been packed and handed to the courier.' },
      { key: 'shipped', title: 'Shipped', description: 'Your order is on the way to your delivery address.' },
    ],
  },
  delivered: {
    label: 'Delivered',
    pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: PackageCheck,
    timeline: [
      { key: 'placed', title: 'Order placed', description: 'Your order has been placed successfully.' },
      { key: 'confirmed', title: 'Order confirmed', description: 'Seller has confirmed your order and started preparation.' },
      { key: 'processing', title: 'Packed', description: 'Your package has been packed and handed to the courier.' },
      { key: 'shipped', title: 'Shipped', description: 'Your order is on the way to your delivery address.' },
      { key: 'delivered', title: 'Delivered', description: 'Your package has been delivered successfully.' },
    ],
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: XCircle,
    timeline: [
      { key: 'placed', title: 'Order placed', description: 'Your order had been created successfully.' },
      { key: 'cancelled', title: 'Cancelled', description: 'This order has been cancelled and will not be shipped.' },
    ],
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getPaymentMethodLabel = (order) => {
  const method = order?.billing_address?.paymentMethod || 'cod';
  const labels = {
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Credit / Debit Card',
    netbanking: 'Net Banking',
  };

  return labels[method] || 'Cash on Delivery';
};

const addDays = (value, days) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const getExpectedDelivery = (order) => {
  if (order.status === 'cancelled') {
    return null;
  }

  if (order.status === 'delivered') {
    return `Delivered on ${formatDateTime(order.updated_at)}`;
  }

  const windows = {
    pending: [2, 3],
    confirmed: [3, 4],
    processing: [4, 6],
    shipped: [1, 2],
  };

  const [minDays, maxDays] = windows[order.status] || [3, 5];
  const minDate = addDays(order.created_at, minDays);
  const maxDate = addDays(order.created_at, maxDays);

  return `Expected delivery ${minDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${maxDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
};

function Timeline({ order }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const steps = meta.timeline;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
      <h3 className="mb-5 text-lg font-semibold text-white">Order Status Timeline</h3>
      <div className="space-y-5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const accent =
            order.status === 'cancelled' && step.key === 'cancelled'
              ? 'bg-red-500'
              : step.key === order.status || index < steps.length - 1
                ? 'bg-emerald-500'
                : 'bg-slate-600';

          return (
            <div key={step.key} className="relative pl-8">
              {!isLast && (
                <span className={`absolute left-[11px] top-6 h-[calc(100%+0.75rem)] w-0.5 ${accent}`} />
              )}
              <span className={`absolute left-0 top-1 h-6 w-6 rounded-full ${accent} ring-4 ring-slate-950`} />
              <div>
                <p className="text-base font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {step.key === 'placed' ? formatDateTime(order.created_at) : formatDateTime(order.updated_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CancelModal({ open, selectedReason, setSelectedReason, onClose, onConfirm, loading }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-red-500/15 p-3 text-red-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Cancel this order?</h2>
            <p className="mt-1 text-sm text-slate-400">
              Select a reason first, then confirm cancellation. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selectedReason === reason
                  ? 'border-red-400 bg-red-500/10 text-white'
                  : 'border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Keep Order
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={!selectedReason} loading={loading}>
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrderDetails({ order, onCancelClick }) {
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const leadItem = order.items?.[0]?.product_snapshot;
  const itemCount = order.items?.length || 0;
  const notes = order.notes?.split('\n').filter(Boolean) || [];
  const paymentMethod = getPaymentMethodLabel(order);
  const paymentStatusLabel = order.payment_status === 'paid' ? 'Paid online' : order.payment_status === 'refunded' ? 'Refund initiated' : 'Pay on delivery';

  return (
    <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 p-2">
              {leadItem?.images?.[0] ? (
                <img src={leadItem.images[0]} alt={leadItem.name} className="h-full w-full object-contain" />
              ) : (
                <PackageCheck className="h-8 w-8 text-slate-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Order #{order.order_number}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {leadItem?.name || 'Order summary'}
                {itemCount > 1 ? ` + ${itemCount - 1} more item${itemCount > 2 ? 's' : ''}` : ''}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-cyan-300" />
                  {formatDateTime(order.created_at)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-cyan-300" />
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          {canCancel && (
            <div className="mt-5 border-t border-slate-700/50 pt-5">
              <Button variant="secondary" onClick={onCancelClick}>
                Cancel Order
              </Button>
            </div>
          )}
        </div>

        <OrderTracking order={order} />

        {notes.length > 0 && (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
            <h3 className="mb-3 text-lg font-semibold text-white">Order Notes</h3>
            <div className="space-y-2 text-sm text-slate-300">
              {notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Delivery Details</h3>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="inline-flex items-start gap-2">
              <MapPinHouse className="mt-0.5 h-4 w-4 text-cyan-300" />
              <span>
                {order.shipping_address?.street}, {order.shipping_address?.city}, {order.shipping_address?.state}
                {' '}{order.shipping_address?.postalCode}, {order.shipping_address?.country}
              </span>
            </p>
            {order.shipping_address?.phone && (
              <p className="text-slate-400">Phone: {order.shipping_address.phone}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Price Details</h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            <div className="border-t border-dashed border-slate-700 pt-3 text-base font-semibold text-white">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Payment Method</h3>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-300" />
              {paymentMethod}
            </p>
            <p className="text-slate-400">{paymentStatusLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [cancelModalOrderId, setCancelModalOrderId] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const message = location.state?.message;

  const fetchOrders = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await getOrderHistory();
      setOrders(data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleToggleOrder = async (orderId) => {
    const nextExpanded = expandedOrderId === orderId ? null : orderId;
    setExpandedOrderId(nextExpanded);

    if (!nextExpanded || detailsById[orderId]) {
      return;
    }

    setDetailsLoadingId(orderId);
    try {
      const { data } = await getOrder(orderId);
      setDetailsById((current) => ({ ...current, [orderId]: data.data }));
    } catch {
      toast.error('Failed to load order details.');
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrderId || !selectedReason) {
      return;
    }

    setCancelling(true);
    try {
      const { data } = await cancelOrder(cancelModalOrderId, {
        reason: selectedReason,
        confirmation: true,
      });
      const updatedOrder = {
        ...data.data,
        lead_item: data.data.items?.[0]?.product_snapshot || data.data.lead_item || null,
        item_count: data.data.items?.length || data.data.item_count || 0,
      };

      toast.success('Order cancelled successfully!');
      setOrders((current) =>
        current.filter((order) => order.id !== cancelModalOrderId)
      );
      setDetailsById((current) => ({
        ...Object.fromEntries(
          Object.entries(current).filter(([id]) => Number(id) !== cancelModalOrderId)
        ),
      }));
      if (expandedOrderId === cancelModalOrderId) {
        setExpandedOrderId(null);
      }
      setCancelModalOrderId(null);
      setSelectedReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const closeCancelModal = () => {
    if (cancelling) {
      return;
    }

    setCancelModalOrderId(null);
    setSelectedReason('');
  };

  const orderCards = useMemo(() => orders, [orders]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Please log in to view orders.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Order History</h1>
          <p className="mt-2 text-slate-400">Track progress, review payment details, and manage active orders.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300">
          <p>Your order has been placed successfully!</p>
          <p>Order confirmed successfully!</p>
          <p>Thank you! Your order is confirmed.</p>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : orderCards.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No orders yet.</p>
      ) : (
        <div className="space-y-5">
          {orderCards.map((order) => {
            const expanded = expandedOrderId === order.id;
            const meta = STATUS_META[order.status] || STATUS_META.pending;
            const StatusIcon = meta.icon || Circle;
            const details = detailsById[order.id];
            const leadItem = order.lead_item;
            const expectedDelivery = getExpectedDelivery(order);

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-slate-700/60 bg-slate-800/40 p-5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => handleToggleOrder(order.id)}
                  className="flex w-full flex-col gap-4 text-left"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-white">{order.order_number}</span>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${meta.pill}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span>{formatDateTime(order.created_at)}</span>
                        <span>{formatCurrency(order.total)}</span>
                        <span>{getPaymentMethodLabel(order)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-cyan-300 lg:shrink-0">
                      <span className="text-sm font-medium">
                        {expanded ? 'Hide order status' : 'View order status'}
                      </span>
                      {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-800 p-2">
                        {leadItem?.images?.[0] ? (
                          <img src={leadItem.images[0]} alt={leadItem?.name || 'Order item'} className="h-full w-full object-contain" />
                        ) : (
                          <PackageCheck className="h-7 w-7 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-base font-semibold text-white">
                          {leadItem?.name || 'Order item'}
                          {order.item_count > 1 ? ` + ${order.item_count - 1} more item${order.item_count > 2 ? 's' : ''}` : ''}
                        </h2>
                        {leadItem?.brand && (
                          <p className="mt-1 text-sm text-slate-400">{leadItem.brand}</p>
                        )}
                        {expectedDelivery && (
                          <p className="mt-3 text-sm text-emerald-300">{expectedDelivery}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {expanded && (
                  <>
                    {detailsLoadingId === order.id && !details ? (
                      <div className="mt-6">
                        <Loader />
                      </div>
                    ) : details ? (
                      <OrderDetails
                        order={details}
                        onCancelClick={() => setCancelModalOrderId(order.id)}
                      />
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CancelModal
        open={Boolean(cancelModalOrderId)}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
      />
    </div>
  );
}
