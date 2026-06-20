"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-jorrey-black flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-jorrey-white mb-4">Something went wrong</h1>
        <p className="text-jorrey-white/40 text-sm mb-8">{error.message}</p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-jorrey-gold text-jorrey-black text-xs tracking-widest uppercase font-semibold hover:bg-jorrey-gold-light transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
