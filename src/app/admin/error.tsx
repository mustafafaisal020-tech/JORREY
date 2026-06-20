"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8">
      <div className="border border-red-100 bg-red-50 px-6 py-5 max-w-lg">
        <h2 className="text-sm font-semibold text-red-700 mb-1">Something went wrong</h2>
        <p className="text-xs text-red-500 mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="text-xs tracking-widest uppercase text-red-600 hover:text-red-800 border border-red-200 px-4 py-2 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
