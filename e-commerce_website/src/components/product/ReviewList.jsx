import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../common/Button.jsx';
import toast from 'react-hot-toast';

export default function ReviewList({ reviews, userReview, onDelete, average_rating, total_reviews }) {
  const { user } = useAuth();
  const [deleteInProgress, setDeleteInProgress] = useState(null);

  const handleDelete = async (reviewId) => {
    setDeleteInProgress(reviewId);
    try {
      await onDelete(reviewId);
      toast.success('Review deleted successfully');
    } catch (error) {
      toast.error('Failed to delete review');
    } finally {
      setDeleteInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-4xl font-bold text-yellow-400">
                {average_rating?.toFixed(1) || '0.0'}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(average_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-400">{total_reviews || 0} reviews</p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = Math.max(0, total_reviews || 0);
              const percentage = count > 0 ? Math.round(((reviews?.filter(r => r.rating === stars).length || 0) / count) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 w-8">{stars}★</span>
                  <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                      />
                    ))}
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-white">{review.title}</h4>
                  )}
                  <p className="text-xs text-slate-400">
                    {review.first_name || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                {user?.id === review.user_id && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deleteInProgress === review.id}
                    className="text-slate-400 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {review.comment && (
                <p className="text-slate-300 text-sm leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}
