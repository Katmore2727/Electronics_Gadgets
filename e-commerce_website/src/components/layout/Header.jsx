import { Link } from 'react-router-dom';
import { Bot, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { useWishlist } from '../../contexts/WishlistContext.jsx';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { getWishlistCount } = useWishlist();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const openChatbot = () => {
    window.dispatchEvent(
      new CustomEvent('chatbot:toggle', {
        detail: { open: true },
      })
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
            YasHub
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-300 hover:text-white transition-colors">Home</Link>
            <Link to="/products" className="text-slate-300 hover:text-white transition-colors">Products</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-slate-300 hover:text-white transition-colors">Admin</Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openChatbot}
              className="hidden lg:inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-200"
            >
              <Bot className="w-4 h-4" />
              Ask AI
            </button>

            <button
              type="button"
              onClick={openChatbot}
              className="relative p-2 text-slate-300 hover:text-cyan-400 transition-colors lg:hidden"
              aria-label="Open AI assistant"
            >
              <Bot className="w-6 h-6" />
            </button>

            <Link
              to="/wishlist"
              className="relative p-2 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Heart className="w-6 h-6" />
              {getWishlistCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {getWishlistCount()}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative p-2 text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-full flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/orders" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:inline">
                  Orders
                </Link>
                <span className="text-slate-400 text-sm hidden sm:inline">{user.firstName}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-cyan-500 text-slate-950 font-medium rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
