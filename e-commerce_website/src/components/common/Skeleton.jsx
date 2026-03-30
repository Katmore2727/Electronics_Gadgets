export function ImageSkeleton() {
  return (
    <div className="w-full aspect-square bg-linear-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg animate-pulse" />
  );
}

export function TextSkeleton({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-linear-to-r from-slate-800 via-slate-700 to-slate-800 rounded animate-pulse"
          style={{ width: i === lines - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-slate-900 p-4 space-y-4">
      <ImageSkeleton />
      <TextSkeleton lines={2} />
      <div className="h-6 bg-linear-to-r from-slate-800 via-slate-700 to-slate-800 rounded animate-pulse w-1/3" />
      <div className="h-10 bg-linear-to-r from-slate-800 via-slate-700 to-slate-800 rounded animate-pulse" />
    </div>
  );
}
