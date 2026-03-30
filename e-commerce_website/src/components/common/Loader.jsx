export default function Loader({ size = 'md' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14' };
  return (
    <div className="flex justify-center items-center p-8">
      <div
        className={`${sizes[size]} border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin`}
      />
    </div>
  );
}
