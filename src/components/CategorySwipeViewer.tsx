"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import type { Category } from "@/lib/category-types";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-coverflow";

export default function CategorySwipeViewer({
  categories,
}: {
  categories: Category[];
}) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [currentIdx, setCurrentIdx] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const n = categories.length;

  if (n === 0) {
    return (
      <div className="h-screen bg-jorrey-black flex items-center justify-center">
        <p className="text-white/20 text-[10px] tracking-[0.5em] uppercase">
          No categories
        </p>
      </div>
    );
  }

  // Arrow visibility — accounts for RTL layout reversal
  const canGoPrev = currentIdx > 0;
  const canGoNext = currentIdx < n - 1;
  const showLeft = isRTL ? canGoNext : canGoPrev;
  const showRight = isRTL ? canGoPrev : canGoNext;

  return (
    <section
      className="relative w-screen bg-black select-none"
      style={{ height: "100dvh" }}
    >
      {/* Slide counter */}
      <div
        className={`absolute top-5 z-20 text-white/20 text-[10px] tracking-[0.3em] tabular-nums pointer-events-none ${
          isRTL ? "left-5" : "right-5"
        }`}
      >
        {String(currentIdx + 1).padStart(2, "0")} /{" "}
        {String(n).padStart(2, "0")}
      </div>

      {/* Swiper — remount on locale change so dir initialises correctly */}
      <Swiper
        key={isRTL ? "rtl" : "ltr"}
        modules={[EffectCoverflow, A11y]}
        effect="coverflow"
        centeredSlides
        slidesPerView={1}
        coverflowEffect={{
          rotate: 8,
          stretch: 0,
          depth: 120,
          modifier: 1,
          slideShadows: false,
        }}
        dir={isRTL ? "rtl" : "ltr"}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => setCurrentIdx(swiper.realIndex)}
        className="w-full h-full"
        a11y={{
          prevSlideMessage: isRTL ? "الشريحة السابقة" : "Previous category",
          nextSlideMessage: isRTL ? "الشريحة التالية" : "Next category",
        }}
      >
        {categories.map((cat, idx) => {
          const name = isRTL && cat.nameAr ? cat.nameAr : cat.name;
          return (
            <SwiperSlide key={cat.id} className="h-full">
              {/*
               * Full-area Link: Swiper's default preventClicks:true stops this
               * firing during/after a swipe, so tapping navigates, swiping does not.
               */}
              <Link
                href={`/category/${cat.slug}`}
                className="absolute inset-0 block"
                draggable={false}
                tabIndex={idx === currentIdx ? 0 : -1}
              >
                {/* Image — object-contain keeps the full portrait product visible
                    on landscape/desktop screens (black bars fill the remainder). */}
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={name}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority={idx === 0}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-jorrey-gold/20 via-jorrey-black/80 to-black" />
                )}

                {/* Gradient overlays for text legibility */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.22) 100%)",
                  }}
                />

                {/* Text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-8 text-center pointer-events-none">
                  <p className="text-jorrey-gold/55 text-[9px] tracking-[0.65em] uppercase mb-4">
                    {isRTL ? "المجموعة" : "Collection"}
                  </p>
                  <h2
                    className="font-serif text-white leading-tight mb-5"
                    style={{
                      fontSize: "clamp(1.8rem, 7vw, 4.5rem)",
                      letterSpacing: "0.09em",
                    }}
                  >
                    {name}
                  </h2>
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-8 h-px bg-jorrey-gold" />
                    <span className="text-white text-[9px] tracking-[0.5em] uppercase">
                      {isRTL ? "اضغط للاستعراض" : "Tap to browse"}
                    </span>
                    <div className="w-8 h-px bg-jorrey-gold" />
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Left arrow */}
      <button
        onClick={() =>
          isRTL
            ? swiperRef.current?.slideNext()
            : swiperRef.current?.slidePrev()
        }
        aria-label={isRTL ? "التالي" : "Previous"}
        className={`absolute left-5 top-1/2 -translate-y-1/2 z-20 p-2 text-white/30 hover:text-white/80 transition-all duration-200 ${
          showLeft ? "" : "opacity-0 pointer-events-none"
        }`}
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

      {/* Right arrow */}
      <button
        onClick={() =>
          isRTL
            ? swiperRef.current?.slidePrev()
            : swiperRef.current?.slideNext()
        }
        aria-label={isRTL ? "السابق" : "Next"}
        className={`absolute right-5 top-1/2 -translate-y-1/2 z-20 p-2 text-white/30 hover:text-white/80 transition-all duration-200 ${
          showRight ? "" : "opacity-0 pointer-events-none"
        }`}
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

      {/* Progress dots */}
      <div className="absolute bottom-8 inset-x-0 z-20 flex justify-center items-center gap-2 pointer-events-none">
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
    </section>
  );
}
