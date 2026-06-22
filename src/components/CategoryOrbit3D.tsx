"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import type { Category } from "@/lib/category-types";

const CARD_W = 158;
const CARD_H = 224;
const AUTO_SPEED = 0.013; // degrees per ms

export default function CategoryOrbit3D({ categories }: { categories: Category[] }) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const n = categories.length;

  const orbitRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const hoverRef = useRef(false);
  const velRef = useRef(0);
  const drag = useRef({ on: false, startX: 0, startAngle: 0, lastX: 0, lastT: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // radius scales with card count so cards never overlap
  const radius = Math.max(290, n * 40);

  // Animation loop — direct DOM mutation for zero re-renders
  useEffect(() => {
    const el = orbitRef.current;
    if (!el || n === 0) return;
    let last = performance.now();
    let raf: number;

    function tick(now: number) {
      const dt = Math.min(now - last, 50);
      last = now;

      if (!drag.current.on) {
        if (!hoverRef.current) angleRef.current += AUTO_SPEED * dt;
        if (Math.abs(velRef.current) > 0.001) {
          angleRef.current += velRef.current * dt;
          velRef.current *= 0.93; // momentum friction
        }
      }

      el!.style.transform = `rotateX(-10deg) rotateY(${angleRef.current}deg)`;
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n]);

  const onDown = useCallback((e: React.PointerEvent) => {
    drag.current = {
      on: true,
      startX: e.clientX,
      startAngle: angleRef.current,
      lastX: e.clientX,
      lastT: performance.now(),
    };
    velRef.current = 0;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.startX;
    angleRef.current = drag.current.startAngle + dx * 0.35;
    const now = performance.now();
    const dt = now - drag.current.lastT;
    if (dt > 0) velRef.current = ((e.clientX - drag.current.lastX) * 0.35) / dt;
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
  }, []);

  const onUp = useCallback(() => {
    drag.current.on = false;
    setIsDragging(false);
  }, []);

  if (n === 0) {
    return (
      <div className="h-screen bg-jorrey-black flex items-center justify-center">
        <p className="text-white/20 text-[10px] tracking-[0.5em] uppercase">No categories yet</p>
      </div>
    );
  }

  return (
    <section
      className="relative h-screen bg-jorrey-black overflow-hidden select-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* Radial gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 100%)",
        }}
      />

      {/* Orbit equator ring */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border border-jorrey-gold/8"
        style={{ width: radius * 2 + CARD_W, height: radius * 2 + CARD_W }}
      />

      {/* Faint JORREY watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span
          className="font-serif leading-none tracking-[0.45em] text-white/[0.022] whitespace-nowrap"
          style={{ fontSize: "17vw" }}
        >
          JORREY
        </span>
      </div>

      {/* 3D perspective container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "1100px" }}
      >
        <div
          ref={orbitRef}
          style={{
            width: CARD_W,
            height: CARD_H,
            transformStyle: "preserve-3d",
            position: "relative",
          }}
        >
          {categories.map((cat, i) => {
            const yAngle = (360 / n) * i;
            const name = isRTL && cat.nameAr ? cat.nameAr : cat.name;

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onMouseEnter={() => { hoverRef.current = true; }}
                onMouseLeave={() => { hoverRef.current = false; }}
                onClick={(e) => {
                  if (drag.current.on || Math.abs(velRef.current) > 0.06)
                    e.preventDefault();
                }}
                style={{
                  position: "absolute",
                  width: CARD_W,
                  height: CARD_H,
                  transform: `rotateY(${yAngle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                className="group block"
              >
                <div className="w-full h-full relative overflow-hidden rounded-[2px] bg-black/70 border border-white/10 group-hover:border-jorrey-gold/55 transition-colors duration-300 flex flex-col">
                  {/* Image */}
                  <div className="relative flex-1 overflow-hidden">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={name}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-jorrey-gold/15 via-jorrey-beige/5 to-black" />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  </div>

                  {/* Name strip */}
                  <div className="shrink-0 py-[10px] px-3 text-center bg-black/80 group-hover:bg-jorrey-gold/8 transition-colors duration-300">
                    <span className="font-serif text-[11px] tracking-[0.25em] uppercase text-white/80 group-hover:text-jorrey-gold transition-colors duration-300">
                      {name}
                    </span>
                  </div>

                  {/* Inner glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: "0 0 28px rgba(212,175,55,0.18) inset" }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-10 inset-x-0 flex items-center justify-center gap-4 pointer-events-none">
        <div className="w-8 h-px bg-jorrey-gold/25" />
        <p className="text-white/20 text-[9px] tracking-[0.55em] uppercase">
          {isRTL ? "اسحب للاستكشاف" : "Drag to explore"}
        </p>
        <div className="w-8 h-px bg-jorrey-gold/25" />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 right-8 flex flex-col items-center gap-1.5 pointer-events-none opacity-25">
        <div className="w-px h-8 bg-white/40" />
        <p className="text-white text-[8px] tracking-widest uppercase" style={{ writingMode: "vertical-rl" }}>
          {isRTL ? "انتقل للأسفل" : "scroll"}
        </p>
      </div>
    </section>
  );
}
