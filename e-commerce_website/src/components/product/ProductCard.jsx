import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../common/Button.jsx';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, loading } = useCart();
  const { user, savePendingCartAction } = useAuth();
  const [imageSrc, setImageSrc] = useState(product.images?.[0] || 'https://placehold.co/400x400/1e293b/64748b?text=No+Image');
  const price = parseFloat(product.price);
  const compareAtPrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const discount = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  // Stock status
  const stockStatus = product.stock_quantity > 0 
    ? product.stock_quantity <= 5 
      ? 'limited'
      : 'available'
    : 'out-of-stock';

  const getStockBadgeColor = () => {
    switch (stockStatus) {
      case 'available':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'limited':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'out-of-stock':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStockText = () => {
    switch (stockStatus) {
      case 'available':
        return 'In Stock';
      case 'limited':
        return `Only ${product.stock_quantity} left`;
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (stockStatus === 'out-of-stock') {
      toast.error('Product is out of stock');
      return;
    }

    if (!user) {
      savePendingCartAction(product.id, 1, location.pathname);
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }

    const result = await addItem(product.id, 1);
    if (result?.error) {
      toast.error(result.error);
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (stockStatus === 'out-of-stock') {
      toast.error('Product is out of stock');
      return;
    }

    if (!user) {
      savePendingCartAction(product.id, 1, '/checkout');
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    const result = await addItem(product.id, 1);
    if (result?.error) {
      toast.error(result.error);
      return;
    }

    navigate('/checkout');
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden bg-slate-800 relative">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+')}
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            -{discount}%
          </div>
        )}

        {/* Stock Status Badge */}
        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-md text-xs font-medium border ${getStockBadgeColor()}`}>
          {getStockText()}
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-slate-400 text-sm mb-1">{product.brand || 'Electronics'}</p>
        <h3 className="mb-2 min-h-[3.5rem] break-words text-sm font-semibold leading-snug text-white transition-colors group-hover:text-cyan-400">
          {product.name}
        </h3>
        
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl font-bold text-cyan-400">₹{price.toFixed(2)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-slate-500 line-through">₹{compareAtPrice.toFixed(2)}</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={loading}
            onClick={handleAddToCart}
            disabled={stockStatus === 'out-of-stock'}
            className="flex-1"
          >
            {stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleBuyNow}
            disabled={stockStatus === 'out-of-stock'}
            className="flex-1"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </Link>
  );
}
