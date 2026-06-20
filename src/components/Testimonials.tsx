"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function Testimonials() {
  const t = useTranslations("testimonials");

  const testimonials = [
    { quote: t("quote1"), name: t("name1"), title: t("role1") },
    { quote: t("quote2"), name: t("name2"), title: t("role2") },
    { quote: t("quote3"), name: t("name3"), title: t("role3") },
  ];

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
            {t("eyebrow")}
          </p>
          <h2 className="font-serif text-5xl md:text-6xl text-jorrey-black leading-tight">
            {t("title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12 }}
              className="bg-jorrey-white p-10 relative"
            >
              <span className="font-serif text-7xl text-jorrey-gold/20 leading-none absolute top-6 start-8 select-none">
                "
              </span>
              <p className="font-serif italic text-jorrey-black/80 text-lg leading-relaxed mb-8 mt-6 relative z-10">
                {item.quote}
              </p>
              <div className="border-t border-jorrey-beige-dark pt-6">
                <p className="text-jorrey-black font-semibold text-sm tracking-wide">
                  {item.name}
                </p>
                <p className="text-jorrey-black/40 text-xs tracking-widest uppercase mt-1">
                  {item.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
