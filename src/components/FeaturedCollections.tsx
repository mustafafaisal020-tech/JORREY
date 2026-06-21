"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/product-types";
import type { Category } from "@/lib/category-types";

const CATEGORY_GRADIENTS = [
  "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%)",
  "linear-gradient(135deg, #c4a882 0%, #d4b896 50%, #b89060 100%)",
  "linear-gradient(135deg, #c9a96e 0%, #e2c99a 50%, #a8833e 100%)",
  "linear-gradient(135deg, #3d2b1f 0%, #6b4226 50%, #2a1a10 100%)",
  "linear-gradient(135deg, #4a4a6a 0%, #6a6a9a 50%, #2a2a4a 100%)",
  "linear-gradient(135deg, #2d4a2d 0%, #4a7a4a 50%, #1a2d1a 100%)",
];

interface Props {
  whatsappNumber?: string;
  currencySymbol?: string;
  products?: Product[];
  categories?: Category[];
  collectionsTitle?: string;
  collectionsTitleAr?: string;
  collectionsDescription?: string;
  collectionsDescriptionAr?: string;
}

export default function FeaturedCollections({
  whatsappNumber = "",
  currencySymbol = "$",
  products = [],
  categories = [],
  collectionsTitle,
  collectionsTitleAr,
  collectionsDescription,
  collectionsDescriptionAr,
}: Props) {
  const t = useTranslations("collections");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const scrollRef = useRef<HTMLDivElement>(null);

  const title = (isRTL ? collectionsTitleAr : collectionsTitle) || t("title");
  const description = (isRTL ? collectionsDescriptionAr : collectionsDescription) || "";

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: (isRTL ? -1 : 1) * (dir === "left" ? -amount : amount),
      behavior: "smooth",
    });
  }

  return (
    <section id="collections" className="bg-jorrey-white py-16 md:py-24 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">

        {/* ── Two-column: left label + right horizontal slides ── */}
        <div className={`flex flex-col md:flex-row items-start gap-8 md:gap-12 lg:gap-20 ${isRTL ? "md:flex-row-reverse" : ""}`}>

          {/* Left column — full width on mobile, fixed on desktop */}
          <div className="flex-shrink-0 w-full md:w-56 lg:w-64 md:pt-2">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
                {t("eyebrow")}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-jorrey-black leading-tight mb-6">
                {title}
              </h2>
              {description && (
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  {description}
                </p>
              )}
              <Link
                href="/explore"
                className="text-jorrey-gold text-xs tracking-[0.25em] uppercase border-b border-jorrey-gold/50 pb-px hover:border-jorrey-gold transition-colors"
              >
                {t("explore")}
              </Link>
            </motion.div>
          </div>

          {/* Right column — horizontal scroll */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              {/* Scroll arrows — desktop only; mobile uses touch scroll */}
              {categories.length > 2 && (
                <div className={`absolute -top-10 hidden md:flex gap-2 ${isRTL ? "left-0" : "right-0"}`}>
                  <button
                    type="button"
                    onClick={() => scroll("left")}
                    className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-400 hover:border-jorrey-black hover:text-jorrey-black transition-colors"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scroll("right")}
                    className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-400 hover:border-jorrey-black hover:text-jorrey-black transition-colors"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Scrollable track */}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((cat, i) => {
                  const displayName = isRTL && cat.nameAr ? cat.nameAr : cat.name;
                  const gradient = CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length];
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.07 }}
                      className="flex-shrink-0"
                      style={{ width: 220 }}
                    >
                      <Link
                        href={`/category/${cat.slug}`}
                        className="group block relative overflow-hidden"
                        style={{ height: 300 }}
                      >
                        <div
                          className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                          style={{ background: cat.image ? undefined : gradient }}
                        >
                          {cat.image && (
                            <Image
                              src={cat.image}
                              alt={displayName}
                              fill
                              sizes="220px"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-jorrey-black/70 via-transparent to-transparent flex items-end p-5">
                          <div>
                            <h3 className="font-serif text-xl text-jorrey-white mb-2 leading-tight">
                              {displayName}
                            </h3>
                            <span className="text-jorrey-gold text-[10px] tracking-[0.25em] uppercase border-b border-jorrey-gold/50 pb-px group-hover:border-jorrey-gold transition-colors">
                              {t("explore")}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Featured products ── */}
        {products.length > 0 && (
          <div className="mt-16 md:mt-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-12"
            >
              <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
                {t("products_eyebrow")}
              </p>
              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl text-jorrey-black">
                {t("products_title")}
              </h2>
            </motion.div>

            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={whatsappNumber}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
