import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { ImageSkeleton } from './Skeleton.jsx';

export default function ImageGallery({ images = [], productName = 'Product' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageSources, setImageSources] = useState(
    images && images.length > 0 ? images : ['https://placehold.co/600x600/1e293b/64748b?text=No+Image']
  );

  const handleImageError = (index) => {
    setImageSources(prev => {
      const newSources = [...prev];
      newSources[index] = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
      return newSources;
    });
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageSources.length - 1 : prev - 1));
    setLoading(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === imageSources.length - 1 ? 0 : prev + 1));
    setLoading(true);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className={`relative w-full aspect-square bg-slate-800 rounded-xl overflow-hidden group cursor-zoom-in ${
          isZoomed ? 'fixed inset-0 z-50 rounded-none aspect-auto m-auto max-w-full max-h-full cursor-zoom-out' : ''
        }`}
        onClick={() => setIsZoomed(!isZoomed)}
      >
        {loading && <ImageSkeleton />}
        <img
          src={imageSources[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          onLoad={handleImageLoad}
          onError={() => handleImageError(currentIndex)}
          className={`w-full h-full object-contain transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'group-hover:scale-105'
          }`}
        />

        {/* Zoom Button */}
        {!isZoomed && imageSources.length > 0 && !loading && (
          <button className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
            <Maximize2 size={20} />
          </button>
        )}

        {/* Navigation Arrows */}
        {imageSources.length > 1 && !isZoomed && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {imageSources.length > 1 && !isZoomed && (
          <span className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            {currentIndex + 1} / {imageSources.length}
          </span>
        )}
      </div>

      {/* Thumbnail List */}
      {imageSources.length > 1 && !isZoomed && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageSources.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setLoading(true);
              }}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === index
                  ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <img
                src={imageSources[index]}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(index)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter for Mobile */}
      {imageSources.length > 1 && !isZoomed && (
        <p className="text-center text-sm text-slate-400">
          {currentIndex + 1} of {imageSources.length}
        </p>
      )}
    </div>
  );
}
