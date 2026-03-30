import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { user, savePendingCartAction } = useAuth();
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  };

  const getImageSrc = (product) => {
    if (imageErrors[product.id]) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjQ3NDhiIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TjwvdGV4dD4KPC9zdmc+';
    }
    return product.images?.[0] || 'https://placehold.co/400x400/1e293b/64748b?text=No+Image';
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error('Please login to add to cart');
      navigate('/login');
      return;
    }

    const result = await addItem(product.id, 1);
    if (result?.error) {
      toast.error(result.error);
    } else {
      removeFromWishlist(product.id);
      toast.success('Added to cart');
    }
  };

  const handleBuyNow = async (product) => {
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

    removeFromWishlist(product.id);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Heart className="fill-red-500 text-red-500" size={32} />
          My Wishlist
        </h1>
        {wishlist.length > 0 && (
          <Button 
            variant="ghost" 
            onClick={() => {
              clearWishlist();
              toast.success('Wishlist cleared');
            }}
          >
            Clear All
          </Button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={64} className="text-slate-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is empty</h2>
          <p className="text-slate-400 mb-6">Save items to your wishlist for later</p>
          <Button onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-800">
                  <img
                    src={getImageSrc(product)}
                    alt={product.name}
                    className="w-full h-full object-contain p-3"
                    onError={() => handleImageError(product.id)}
                  />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2 right-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 min-h-[3.5rem] break-words text-sm font-semibold leading-snug text-white">{product.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-cyan-400">
                      ₹{(parseFloat(product.price) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleBuyNow(product)}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-slate-800/30 rounded-lg p-6 border border-slate-700/30">
            <h3 className="text-xl font-semibold text-white mb-4">Wishlist Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Items in Wishlist</p>
                <p className="text-3xl font-bold text-cyan-400">{wishlist.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Value</p>
                <p className="text-3xl font-bold text-cyan-400">
                  ₹{wishlist.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Average Price</p>
                <p className="text-3xl font-bold text-cyan-400">
                  ₹{(wishlist.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) / wishlist.length).toFixed(2)}
                </p>
              </div>
              <div>
                <Button onClick={() => navigate('/products')} variant="outline" className="w-full mt-6">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
