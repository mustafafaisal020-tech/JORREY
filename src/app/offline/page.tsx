"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center text-center px-6 bg-jorrey-black">
      {/* Brand mark */}
      <div className="w-16 h-16 border border-jorrey-gold/40 flex items-center justify-center mb-8">
        <span className="font-serif text-3xl font-bold text-jorrey-gold leading-none">J</span>
      </div>

      {/* English */}
      <h1 className="font-serif text-2xl text-jorrey-gold font-semibold mb-3">
        You&apos;re offline
      </h1>
      <p className="text-jorrey-white/50 text-sm leading-relaxed max-w-xs">
        This page isn&apos;t cached yet. Check your connection and try again.
      </p>

      {/* Arabic */}
      <p
        dir="rtl"
        className="mt-4 text-jorrey-white/40 text-sm leading-relaxed max-w-xs"
        style={{ fontFamily: "var(--font-cairo, sans-serif)" }}
      >
        أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="mt-8 border border-jorrey-gold/50 text-jorrey-gold text-[10px] tracking-widest uppercase px-6 py-3 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors"
      >
        Try again / أعد المحاولة
      </button>
    </main>
  );
}
