"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="bg-jorrey-beige py-32 px-6 lg:px-10 overflow-hidden relative">
      {/* Decorative element */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-jorrey-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-jorrey-gold/10 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-6">
            2025 Collection
          </p>
          <h2 className="font-serif text-5xl md:text-7xl text-jorrey-black leading-tight mb-8">
            The New Collection
            <br />
            <span className="italic text-jorrey-gold-dark">Has Arrived.</span>
          </h2>
          <p className="text-jorrey-black/50 text-base md:text-lg font-sans leading-relaxed mb-12 max-w-lg mx-auto">
            Refined silhouettes, rare fabrics, and details that reward
            attention. Discover the season&apos;s most anticipated pieces.
          </p>

          <motion.a
            href="#collections"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block bg-jorrey-black text-jorrey-white text-xs tracking-[0.25em] uppercase font-semibold px-14 py-5 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors duration-400"
          >
            Shop the Collection
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
