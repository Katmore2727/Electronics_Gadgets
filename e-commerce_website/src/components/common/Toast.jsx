import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const colors = {
    success: 'bg-emerald-500/90 text-white',
    error: 'bg-red-500/90 text-white',
    info: 'bg-cyan-500/90 text-slate-950',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${colors[type]}`}
    >
      {message}
    </div>
  );
}
