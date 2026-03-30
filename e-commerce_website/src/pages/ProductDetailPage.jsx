import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Star, Heart, Share2, ShoppingCart } from 'lucide-react';
import { getProduct, getRecommendations, getReviews, getMyReview, createReview, deleteReview } from '../api/productApi.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import ImageGallery from '../components/product/ImageGallery.jsx';
import ReviewForm from '../components/product/ReviewForm.jsx';
import ReviewList from '../components/product/ReviewList.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, savePendingCartAction } = useAuth();
  const { addItem, loading: cartLoading } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getProduct(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (product?.id) {
      getRecommendations(id, 5)
        .then(({ data }) => setRecommendations(data.data || []))
        .catch(() => setRecommendations([]));

      // Load reviews
      loadReviews();
    }
  }, [id, product?.id]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const [reviewsRes, myReviewRes] = await Promise.all([
        getReviews(id, { limit: 20 }),
        user ? getMyReview(id) : Promise.resolve(null),
      ]);
      setReviews(reviewsRes.data?.data || []);
      setRatingData(reviewsRes.data?.rating);
      if (myReviewRes?.data?.data) {
        setMyReview(myReviewRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      savePendingCartAction(product.id, quantity, location.pathname);
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (product.stock_quantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    const result = await addItem(product.id, quantity);
    if (result?.error) {
      toast.error(result.error);
    }

    return result;
  };

  const handleBuyNow = async () => {
    if (!user) {
      savePendingCartAction(product.id, quantity, '/checkout');
      toast.error('Please login to buy now');
      navigate('/login');
      return;
    }

    const result = await handleAddToCart();
    if (result?.success) {
      navigate('/checkout');
    }
  };

  const handleWishlist = () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const handleReviewSubmit = async (data) => {
    try {
      await createReview(id, data);
      toast.success(myReview ? 'Review updated successfully' : 'Review submitted successfully');
      await loadReviews();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      await loadReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  if (loading) return <Loader size="lg" />;
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl text-slate-400 mb-4">Product not found</h2>
        <button onClick={() => navigate('/products')} className="text-cyan-400 hover:underline">
          Back to products
        </button>
      </div>
    );
  }

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
        return `Only ${product.stock_quantity} left - Order Soon!`;
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image Gallery */}
        <div>
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-6">
            <p className="text-slate-400 text-sm mb-2">{product.brand || 'Electronics'}</p>
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>

            {/* Stars Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(ratingData?.average_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-400">
                ({ratingData?.average_rating?.toFixed(1) || '4.0'}) • {ratingData?.total_reviews || 0} reviews
              </span>
            </div>

            {/* Price Section */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-cyan-400">₹{price.toFixed(2)}</span>
              {compareAtPrice && compareAtPrice > price && (
                <>
                  <span className="text-2xl text-slate-500 line-through">₹{compareAtPrice.toFixed(2)}</span>
                  <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                    -{discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className={`inline-block px-4 py-2 rounded-lg border ${getStockBadgeColor()} font-medium mb-6`}>
              {getStockText()}
            </div>

            {/* Delivery Information */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 font-medium">Free Delivery</span>
              </div>
              <p className="text-slate-300 text-sm">
                Get free delivery on orders above ₹500. Standard delivery within 3-5 business days.
              </p>
            </div>

            {/* Offers */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
              <h4 className="text-orange-400 font-medium mb-3">Available Offers</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>10% Instant Discount on HDFC Bank Credit Cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>5% Cashback on Paytm UPI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>EMI starting from ₹{Math.round(price / 12)}. No cost EMI available</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-300 mb-8 leading-relaxed">
            {product.description || 'No description available.'}
          </p>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mb-8 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Specifications</h3>
              <div className="space-y-3">
                {Object.entries(product.specifications).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-600/30">
                    <span className="text-slate-400 capitalize">{key}</span>
                    <span className="text-white font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-slate-300 font-medium">Quantity:</label>
              <div className="flex items-center border border-slate-700 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={product.stock_quantity || 99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 text-center bg-slate-800 text-white border-0"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleAddToCart}
                loading={cartLoading}
                disabled={stockStatus === 'out-of-stock'}
                size="lg"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                {stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={stockStatus === 'out-of-stock'}
                variant="secondary"
                size="lg"
                className="flex-1 flex items-center justify-center gap-2"
              >
                Buy Now
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleWishlist}
                variant="outline"
                size="lg"
                className="flex items-center justify-center gap-2"
              >
                <Heart size={20} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const text = `Check out ${product.name} at ₹${price.toFixed(2)}`;
                  navigator.share?.({ title: product.name, text }) || 
                  navigator.clipboard.writeText(`${window.location.href}`);
                  toast.success('Link copied to clipboard');
                }}
              >
                <Share2 size={20} />
              </Button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
            <div className="text-center">
              <div className="text-cyan-400 text-2xl mb-1">✓</div>
              <p className="text-xs text-slate-400">Free Shipping</p>
            </div>
            <div className="text-center">
              <div className="text-cyan-400 text-2xl mb-1">✓</div>
              <p className="text-xs text-slate-400">30-Day Returns</p>
            </div>
            <div className="text-center">
              <div className="text-cyan-400 text-2xl mb-1">✓</div>
              <p className="text-xs text-slate-400">1-Year Warranty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-8">Customer Reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {reviewsLoading ? (
              <Loader />
            ) : (
              <ReviewList 
                reviews={reviews}
                userReview={myReview}
                onDelete={handleReviewDelete}
                average_rating={ratingData?.average_rating}
                total_reviews={ratingData?.total_reviews}
              />
            )}
          </div>
          <div>
            <ReviewForm 
              productId={id}
              onSubmit={handleReviewSubmit}
              existingReview={myReview}
            />
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
