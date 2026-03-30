import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as cartApi from '../api/cartApi.js';
import { useAuth } from './AuthContext.jsx';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], itemCount: 0, subtotal: 0 });
      return;
    }
    try {
      const { data } = await cartApi.getCart();
      setCart(data.data || { items: [], itemCount: 0, subtotal: 0 });
    } catch {
      setCart({ items: [], itemCount: 0, subtotal: 0 });
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchCart();
  }, [user, fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    if (!user) {
      return { error: 'Please login to add to cart' };
    }

    setLoading(true);
    try {
      const { data } = await cartApi.addToCart(productId, quantity);
      setCart(data.data || { items: [], itemCount: 0, subtotal: 0 });
      toast.success('Item added to cart!');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (productId, quantity) => {
    if (!user) return { error: 'Please login' };

    setLoading(true);
    try {
      const { data } = await cartApi.updateCartItem(productId, quantity);
      setCart(data.data || { items: [], itemCount: 0, subtotal: 0 });
      toast.success('Cart updated');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update';
      toast.error(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    if (!user) return { error: 'Please login' };

    setLoading(true);
    try {
      const { data } = await cartApi.removeFromCart(productId);
      setCart(data.data || { items: [], itemCount: 0, subtotal: 0 });
      toast.success('Item removed from cart');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove';
      toast.error(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await cartApi.clearCart();
      setCart(data.data || { items: [], itemCount: 0, subtotal: 0 });
      toast.success('Cart cleared');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addItem,
        updateItem,
        removeItem,
        clear,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
