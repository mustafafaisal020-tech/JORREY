"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center bg-jorrey-black overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#2a1f0e_0%,_#0C0C0C_60%)]" />
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBMMjAgMEw0MCAyMEwyMCA0MHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0M5QTk2RSIgc3Ryb2tlLXdpZHRoPSIwLjMiLz48L3N2Zz4=')]" />

      {/* Decorative vertical lines */}
      <div className="absolute left-[12%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-jorrey-gold/20 to-transparent" />
      <div className="absolute right-[12%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-jorrey-gold/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.35em" }}
          transition={{ duration: 1.2 }}
          className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-8 font-sans"
        >
          New Season — 2025
        </motion.p>

        <div className="overflow-hidden mb-4">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-6xl md:text-8xl lg:text-9xl text-jorrey-white leading-[0.9] tracking-tight"
          >
            Elegance
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-4">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif italic text-6xl md:text-8xl lg:text-9xl text-jorrey-gold leading-[0.9] tracking-tight"
          >
            Designed
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-12">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-6xl md:text-8xl lg:text-9xl text-jorrey-white leading-[0.9] tracking-tight"
          >
            for You
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-jorrey-beige/50 text-base md:text-lg mb-12 max-w-sm mx-auto font-sans leading-relaxed tracking-wide"
        >
          Curated luxury pieces for the discerning few.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#collections"
            className="px-10 py-4 bg-jorrey-gold text-jorrey-black text-xs tracking-[0.2em] uppercase font-semibold hover:bg-jorrey-gold-light transition-colors duration-300"
          >
            Shop Now
          </a>
          <a
            href="#about"
            className="px-10 py-4 border border-jorrey-white/20 text-jorrey-white/70 text-xs tracking-[0.2em] uppercase hover:border-jorrey-gold hover:text-jorrey-gold transition-colors duration-300"
          >
            Our Story
          </a>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-jorrey-white/30 text-[10px] tracking-[0.3em] uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ scaleY: [0, 1, 0], originY: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-jorrey-gold/50"
        />
      </motion.div>
    </section>
  );
}
