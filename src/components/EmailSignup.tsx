"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section id="signup" className="bg-jorrey-black py-28 px-6 lg:px-10">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-6">
            Exclusive Access
          </p>
          <h2 className="font-serif text-5xl md:text-6xl text-jorrey-white leading-tight mb-6">
            Join the{" "}
            <span className="italic text-jorrey-gold">Inner Circle</span>
          </h2>
          <p className="text-jorrey-white/40 text-base font-sans leading-relaxed mb-12">
            Be the first to discover new collections, private events, and
            stories from behind the atelier.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-jorrey-gold/30 px-8 py-6"
            >
              <p className="font-serif italic text-jorrey-gold text-xl mb-1">
                Welcome to Jorrey.
              </p>
              <p className="text-jorrey-white/50 text-sm">
                You&apos;re now part of something rare.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 bg-transparent border border-jorrey-white/20 border-r-0 sm:border-r-0 px-6 py-4 text-jorrey-white text-sm placeholder:text-jorrey-white/30 focus:outline-none focus:border-jorrey-gold/50 transition-colors"
              />
              <button
                type="submit"
                className="bg-jorrey-gold text-jorrey-black text-xs tracking-[0.2em] uppercase font-semibold px-8 py-4 hover:bg-jorrey-gold-light transition-colors duration-300 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
