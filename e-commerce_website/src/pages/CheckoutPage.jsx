import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orderApi.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    paymentMethod: 'cod',
    notes: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!orderPlaced && user && cart.items.length === 0 && !loading) {
      navigate('/cart', { replace: true });
    }
  }, [orderPlaced, user, cart.items.length, loading, navigate]);

  if (!user) {
    return null;
  }

  if (!orderPlaced && cart.items.length === 0 && !loading) {
    return null;
  }

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const address = {
      street: form.street,
      city: form.city,
      state: form.state || '',
      postalCode: form.postalCode,
      country: form.country,
      phone: form.phone || '',
    };
    setLoading(true);
    try {
      await createOrder({
        shippingAddress: address,
        billingAddress: address,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      });
      setOrderPlaced(true);
      toast.success('Your order has been placed successfully!');
      await clear();
      navigate('/orders', { state: { message: 'Order placed successfully!' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Shipping Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="street"
              placeholder="Street address"
              required
              value={form.street}
              onChange={updateForm}
              className="sm:col-span-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
            <input
              name="city"
              placeholder="City"
              required
              value={form.city}
              onChange={updateForm}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
            <input
              name="state"
              placeholder="State / Province"
              value={form.state}
              onChange={updateForm}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
            <input
              name="postalCode"
              placeholder="Postal code"
              required
              value={form.postalCode}
              onChange={updateForm}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
            <input
              name="country"
              placeholder="Country"
              required
              value={form.country}
              onChange={updateForm}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={updateForm}
              className="sm:col-span-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'cod', label: 'Cash on Delivery', subtitle: 'Pay when your order arrives' },
              { value: 'upi', label: 'UPI', subtitle: 'Fast online payment' },
              { value: 'card', label: 'Credit / Debit Card', subtitle: 'Secure card payment' },
              { value: 'netbanking', label: 'Net Banking', subtitle: 'Pay using your bank account' },
            ].map((method) => (
              <label
                key={method.value}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  form.paymentMethod === method.value
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={form.paymentMethod === method.value}
                  onChange={updateForm}
                  className="sr-only"
                />
                <p className="font-medium text-white">{method.label}</p>
                <p className="mt-1 text-sm text-slate-400">{method.subtitle}</p>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Order notes</label>
          <textarea
            name="notes"
            rows={3}
            value={form.notes}
            onChange={updateForm}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            placeholder="Optional notes..."
          />
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl">
          <p className="text-slate-400">
            Total: <span className="text-2xl font-bold text-cyan-400">${(cart.subtotal || 0).toFixed(2)}</span>
          </p>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          Place Order
        </Button>
      </form>
    </div>
  );
}
