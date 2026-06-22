"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { Category } from "@/lib/category-types";

// Per-card component so each card can own its parallax hooks
function CategoryCard({
  cat,
  index,
  x,
  isRTL,
}: {
  cat: Category;
  index: number;
  x: ReturnType<typeof useMotionValue<number>>;
  isRTL: boolean;
}) {
  const vwRef = useRef(390);

  useEffect(() => {
    vwRef.current = window.innerWidth;
    const h = () => { vwRef.current = window.innerWidth; };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Offset of this card from viewport center (0 = centred, ±vw = adjacent)
  const offset = useTransform(x, (v) => v + index * vwRef.current);

  // Image lags at 25% speed → depth illusion
  const imgX = useTransform(offset, (v) => -v * 0.25);

  // Title floats slightly against motion
  const titleY = useTransform(offset, (v) => v * 0.035);

  const name = isRTL && cat.nameAr ? cat.nameAr : cat.name;

  return (
    <div
      style={{
        width: "100vw",
        height: "100%",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Parallax image layer — oversized so parallax never shows edges */}
      <motion.div
        style={{ x: imgX, position: "absolute", inset: "-8% -10%" }}
      >
        {cat.image ? (
          <Image
            src={cat.image}
            alt={name}
            fill
            priority={index === 0}
            sizes="120vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-jorrey-gold/20 via-jorrey-black/80 to-black" />
        )}
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/10 to-black/25" />

      {/* Parallax text layer */}
      <motion.div
        style={{ y: titleY }}
        className="absolute inset-0 flex flex-col items-center justify-end pb-28 px-8 text-center pointer-events-none"
      >
        <p className="text-jorrey-gold/55 text-[9px] tracking-[0.65em] uppercase mb-4">
          {isRTL ? "المجموعة" : "Collection"}
        </p>

        <h2
          className="font-serif text-white leading-tight mb-5"
          style={{ fontSize: "clamp(2rem, 8vw, 4.5rem)", letterSpacing: "0.09em" }}
        >
          {name}
        </h2>

        <div className="flex items-center gap-3 opacity-45">
          <div className="w-8 h-px bg-jorrey-gold" />
          <span className="text-white text-[9px] tracking-[0.5em] uppercase">
            {isRTL ? "اضغط للاستعراض" : "Tap to browse"}
          </span>
          <div className="w-8 h-px bg-jorrey-gold" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main viewer ─────────────────────────────────────────────────────────────

export default function CategorySwipeViewer({
  categories,
}: {
  categories: Category[];
}) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();
  const n = categories.length;

  const x = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentIdxRef = useRef(0);

  const drag = useRef({
    on: false,
    startClientX: 0,
    startX: 0,
    lastClientX: 0,
    lastT: 0,
    vel: 0,
  });

  const snapTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(n - 1, idx));
      const vw = window.innerWidth;
      animate(x, -clamped * vw, {
        type: "spring",
        stiffness: 320,
        damping: 38,
        mass: 0.8,
      });
      animate(tiltY, 0, { type: "spring", stiffness: 400, damping: 35 });
      setCurrentIdx(clamped);
      currentIdxRef.current = clamped;
    },
    [n, x, tiltY]
  );

  // Keyboard navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        snapTo(currentIdxRef.current + (isRTL ? -1 : 1));
      if (e.key === "ArrowLeft")
        snapTo(currentIdxRef.current + (isRTL ? 1 : -1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [snapTo, isRTL]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      drag.current = {
        on: true,
        startClientX: e.clientX,
        startX: x.get(),
        lastClientX: e.clientX,
        lastT: Date.now(),
        vel: 0,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [x]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current.on) return;
      const vw = window.innerWidth;
      const dx = e.clientX - drag.current.startClientX;
      const raw = drag.current.startX + dx;
      const minX = -(n - 1) * vw;
      const maxX = 0;

      // Rubber-band resistance at edges
      const bounded =
        raw < minX
          ? minX + (raw - minX) * 0.1
          : raw > maxX
          ? maxX + (raw - maxX) * 0.1
          : raw;
      x.set(bounded);

      // Track velocity
      const now = Date.now();
      const dt = now - drag.current.lastT;
      if (dt > 0)
        drag.current.vel = (e.clientX - drag.current.lastClientX) / dt;
      drag.current.lastClientX = e.clientX;
      drag.current.lastT = now;

      // 3D tilt proportional to swipe velocity (swipe left → lean left)
      const tilt = Math.max(-8, Math.min(8, -drag.current.vel * 10));
      tiltY.set(tilt);
    },
    [x, tiltY, n]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current.on) return;
      drag.current.on = false;

      const dx = e.clientX - drag.current.startClientX;
      const vel = drag.current.vel;
      const vw = window.innerWidth;

      // Tap: navigate to category page
      if (Math.abs(dx) < 10) {
        const cat = categories[currentIdxRef.current];
        if (cat) router.push(`/category/${cat.slug}`);
        animate(tiltY, 0, { type: "spring", stiffness: 400, damping: 35 });
        return;
      }

      // Determine next index from swipe distance + velocity
      let next = currentIdxRef.current;
      const threshold = vw * 0.2;
      const dir = isRTL ? -1 : 1;

      if (dx < -threshold || vel < -0.4) next += dir;
      else if (dx > threshold || vel > 0.4) next -= dir;

      snapTo(next);
    },
    [categories, router, isRTL, tiltY, snapTo]
  );

  if (n === 0) {
    return (
      <div className="h-screen bg-jorrey-black flex items-center justify-center">
        <p className="text-white/20 text-[10px] tracking-[0.5em] uppercase">
          No categories
        </p>
      </div>
    );
  }

  return (
    <section
      className="relative w-full bg-black overflow-hidden"
      style={{ height: "100dvh", perspective: "1400px" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* 3D tilt wrapper → sliding track */}
      <motion.div style={{ rotateY: tiltY, width: "100%", height: "100%" }}>
        <motion.div
          style={{
            x,
            display: "flex",
            width: `${n * 100}vw`,
            height: "100%",
          }}
        >
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              x={x}
              isRTL={isRTL}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* ── Index counter top-right ── */}
      <div className="absolute top-5 right-5 z-10 pointer-events-none text-white/20 text-[10px] tracking-[0.3em] tabular-nums">
        {String(currentIdx + 1).padStart(2, "0")} /{" "}
        {String(n).padStart(2, "0")}
      </div>

      {/* ── Progress dots ── */}
      <div className="absolute bottom-8 inset-x-0 z-10 flex justify-center items-center gap-2 pointer-events-none">
        {categories.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === currentIdx
                ? "w-6 h-[5px] bg-jorrey-gold"
                : "w-[5px] h-[5px] bg-white/25"
            }`}
          />
        ))}
      </div>

      {/* ── Desktop chevrons ── */}
      {currentIdx > 0 && (
        <button
          className="absolute left-5 top-1/2 -translate-y-1/2 z-10 text-white/25 hover:text-white/65 transition-colors p-2"
          onClick={() => snapTo(currentIdx - 1)}
          aria-label="Previous category"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}
      {currentIdx < n - 1 && (
        <button
          className="absolute right-5 top-1/2 -translate-y-1/2 z-10 text-white/25 hover:text-white/65 transition-colors p-2"
          onClick={() => snapTo(currentIdx + 1)}
          aria-label="Next category"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
