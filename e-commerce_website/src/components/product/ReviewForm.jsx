import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import toast from 'react-hot-toast';

export default function ReviewForm({ productId, onSubmit, existingReview }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to write a review');
      navigate('/login');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/30 text-center">
        <p className="text-slate-300 mb-4">Sign in to write a review</p>
        <Button onClick={() => navigate('/login')} variant="primary">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/30 space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Rating *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-all"
            >
              <Star
                size={28}
                className={`${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Review Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 255))}
          placeholder="Summarize your experience..."
          maxLength="255"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-slate-500 mt-1">{title.length}/255</p>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 2000))}
          placeholder="Share your experience with this product..."
          maxLength="2000"
          rows="4"
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">{comment.length}/2000</p>
      </div>

      {/* Submit Button */}
      <Button type="submit" loading={loading} className="w-full">
        {existingReview ? 'Update Review' : 'Submit Review'}
      </Button>
    </form>
  );
}
