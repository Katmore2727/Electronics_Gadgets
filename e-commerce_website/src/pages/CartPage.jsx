import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import { useState } from 'react';

export default function CartPage() {
  const { user } = useAuth();
  const { cart, updateItem, removeItem, loading } = useCart();
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const getImageSrc = (item) => {
    if (imageErrors[item.productId]) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjQ3NDhiIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TjwvdGV4dD4KPC9zdmc+';
    }
    return item.image || 'https://placehold.co/400x400/1e293b/64748b?text=No+Image';
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl text-slate-400 mb-4">Please log in to view your cart</h2>
        <Link to="/login" className="text-cyan-400 hover:underline">Go to Login</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
        <p className="text-slate-400 mb-6">Add some products to get started.</p>
        <Link to="/products">
          <Button variant="primary">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            return (
              <div
                key={item.productId}
                className="flex flex-col gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 sm:flex-row sm:items-start"
              >
                <img
                  src={getImageSrc(item)}
                  alt={item.name}
                  className="h-24 w-24 shrink-0 rounded-lg bg-slate-800 object-contain p-2"
                  onError={() => handleImageError(item.productId)}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.productId}`}
                    className="block break-words text-base font-medium leading-snug text-white hover:text-cyan-400"
                  >
                    {item.name}
                  </Link>
                  <p className="text-cyan-400 font-semibold mt-1">${item.price?.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 sm:self-center">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.productId, Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-14 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-center"
                  />
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-left sm:self-center sm:text-right">
                  <p className="font-semibold text-white">${(item.subtotal || item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              <p className="flex justify-between text-slate-400">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span className="text-white">${(cart.subtotal || 0).toFixed(2)}</span>
              </p>
            </div>
            <p className="flex justify-between text-xl font-bold text-white mb-6">
              <span>Total</span>
              <span className="text-cyan-400">${(cart.subtotal || 0).toFixed(2)}</span>
            </p>
            <Link to="/checkout" className="block">
              <Button variant="primary" className="w-full" loading={loading}>
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
