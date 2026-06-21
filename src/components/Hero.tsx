"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale } from "next-intl";
import type { HomeSection } from "@/lib/pages-types";

interface HeroProps {
  section?: HomeSection;
}

export default function Hero({ section }: HeroProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const heading = isRTL && section?.headingAr ? section.headingAr : section?.heading;
  const subheading = isRTL && section?.subheadingAr ? section.subheadingAr : section?.subheading;
  const hasContent = !!(heading || subheading);

  return (
    <section className="relative h-screen flex items-center justify-center bg-jorrey-black overflow-hidden">
      {section?.image ? (
        <>
          <Image
            src={section.image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-jorrey-black/55" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#2a1f0e_0%,_#0C0C0C_60%)]" />
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0M5QTk2RSIgc3Ryb2tlLXdpZHRoPSIwLjMiLz48L3N2Zz4=')]" />
      <div className="absolute start-[12%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-jorrey-gold/20 to-transparent" />
      <div className="absolute end-[12%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-jorrey-gold/20 to-transparent" />

      {/* Content — only rendered if admin has set heading or subheading */}
      {hasContent && (
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
          {heading && (
            <div className="overflow-hidden mb-6">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-jorrey-white leading-[0.9] tracking-tight"
              >
                {heading}
              </motion.h1>
            </div>
          )}
          {subheading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-jorrey-beige/60 text-base md:text-lg max-w-sm mx-auto font-sans leading-relaxed tracking-wide"
            >
              {subheading}
            </motion.p>
          )}
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <motion.div
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-jorrey-gold/50"
        />
      </motion.div>
    </section>
  );
}
