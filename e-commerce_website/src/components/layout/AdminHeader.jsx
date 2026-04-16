import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="text-xl font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
              YasHub Admin
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/admin/orders"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Orders
              </Link>
              <Link
                to="/admin/products"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Package className="w-4 h-4" />
                Products
              </Link>
              <Link
                to="/admin/users"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Users className="w-4 h-4" />
                Users
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:inline">
              Admin: {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}