import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/authApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCartAction, setPendingCartAction] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData) => setUser(userData);

  const logout = () => {
    setUser(null);
    setPendingCartAction(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('pendingCartAction');
    // Clear cart and wishlist data on logout
    localStorage.removeItem('cartItems');
    localStorage.removeItem('wishlistItems');
  };

  const savePendingCartAction = (productId, quantity = 1, fromPage = '/') => {
    const pending = {
      productId,
      quantity,
      fromPage,
      timestamp: Date.now(),
    };
    setPendingCartAction(pending);
    localStorage.setItem('pendingCartAction', JSON.stringify(pending));
  };

  const getPendingCartAction = () => pendingCartAction;

  const clearPendingCartAction = () => {
    setPendingCartAction(null);
    localStorage.removeItem('pendingCartAction');
  };

  useEffect(() => {
    if (user && !pendingCartAction) {
      const saved = localStorage.getItem('pendingCartAction');
      if (saved) {
        try {
          const pending = JSON.parse(saved);
          if (pending && Date.now() - pending.timestamp < 30 * 60 * 1000) {
            setPendingCartAction(pending);
          } else {
            localStorage.removeItem('pendingCartAction');
          }
        } catch {
          localStorage.removeItem('pendingCartAction');
        }
      }
    }
  }, [user, pendingCartAction]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        savePendingCartAction,
        getPendingCartAction,
        clearPendingCartAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
