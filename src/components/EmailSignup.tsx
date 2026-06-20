"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function EmailSignup() {
  const t = useTranslations("email");
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
            {t("eyebrow")}
          </p>
          <h2 className="font-serif text-5xl md:text-6xl text-jorrey-white leading-tight mb-6">
            {t("title")}{" "}
            <span className="italic text-jorrey-gold">{t("accent")}</span>
          </h2>
          <p className="text-jorrey-white/40 text-base font-sans leading-relaxed mb-12">
            {t("desc")}
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-jorrey-gold/30 px-8 py-6"
            >
              <p className="font-serif italic text-jorrey-gold text-xl mb-1">
                {t("success_title")}
              </p>
              <p className="text-jorrey-white/50 text-sm">{t("success_sub")}</p>
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
                placeholder={t("placeholder")}
                required
                className="flex-1 bg-transparent border border-jorrey-white/20 border-e-0 px-6 py-4 text-jorrey-white text-sm placeholder:text-jorrey-white/30 focus:outline-none focus:border-jorrey-gold/50 transition-colors"
              />
              <button
                type="submit"
                className="bg-jorrey-gold text-jorrey-black text-xs tracking-[0.2em] uppercase font-semibold px-8 py-4 hover:bg-jorrey-gold-light transition-colors duration-300 whitespace-nowrap"
              >
                {t("button")}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
