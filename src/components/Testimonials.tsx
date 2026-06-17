"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Jorrey pieces are unlike anything I've worn before. The craftsmanship is flawless — every detail feels intentional.",
    name: "Isabelle M.",
    title: "Creative Director, Paris",
  },
  {
    quote:
      "I wore the Silk Noir Blazer to a gala and received compliments all evening. Jorrey is my secret weapon.",
    name: "Nadia K.",
    title: "Architect & Style Enthusiast",
  },
  {
    quote:
      "The quality speaks for itself. These are garments you keep for decades, not seasons.",
    name: "Celeste R.",
    title: "Editor-at-Large",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-jorrey-beige py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
            The Jorrey Experience
          </p>
          <h2 className="font-serif text-5xl md:text-6xl text-jorrey-black leading-tight">
            What They Say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="bg-jorrey-white p-10 relative"
            >
              <span className="font-serif text-7xl text-jorrey-gold/20 leading-none absolute top-6 left-8 select-none">
                "
              </span>
              <p className="font-serif italic text-jorrey-black/80 text-lg leading-relaxed mb-8 mt-6 relative z-10">
                {t.quote}
              </p>
              <div className="border-t border-jorrey-beige-dark pt-6">
                <p className="text-jorrey-black font-semibold text-sm tracking-wide">
                  {t.name}
                </p>
                <p className="text-jorrey-black/40 text-xs tracking-widest uppercase mt-1">
                  {t.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
