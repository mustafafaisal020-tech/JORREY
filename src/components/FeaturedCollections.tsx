"use client";

import { motion } from "framer-motion";
import ProductCard, { Product } from "./ProductCard";

const collections = [
  {
    id: "noir",
    name: "The Noir Edit",
    description: "Timeless blacks, charcoals, and deep navies.",
    bg: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%)",
  },
  {
    id: "desert",
    name: "Desert Rose",
    description: "Warm sands, dusty roses, and terracotta warmth.",
    bg: "linear-gradient(135deg, #c4a882 0%, #d4b896 50%, #b89060 100%)",
  },
  {
    id: "golden",
    name: "Golden Hour",
    description: "Rich golds, creams, and sun-burnished amber.",
    bg: "linear-gradient(135deg, #c9a96e 0%, #e2c99a 50%, #a8833e 100%)",
  },
];

const products: Product[] = [
  {
    id: "p1",
    name: "Silk Noir Blazer",
    category: "Outerwear",
    price: 1850,
    bgColor: "linear-gradient(160deg, #1c1c1c 0%, #333 100%)",
    isNew: true,
  },
  {
    id: "p2",
    name: "Cashmere Wrap Coat",
    category: "Coats",
    price: 3200,
    bgColor: "linear-gradient(160deg, #c4a882 0%, #a08060 100%)",
  },
  {
    id: "p3",
    name: "Gold-Trim Trench",
    category: "Outerwear",
    price: 2450,
    bgColor: "linear-gradient(160deg, #d4c4a0 0%, #b89a70 100%)",
    isNew: true,
  },
  {
    id: "p4",
    name: "Noir Silk Dress",
    category: "Dresses",
    price: 1650,
    bgColor: "linear-gradient(160deg, #0a0a0a 0%, #2a2a2a 100%)",
  },
];

export default function FeaturedCollections() {
  return (
    <section id="collections" className="bg-jorrey-white py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
            Curated for You
          </p>
          <h2 className="font-serif text-5xl md:text-6xl text-jorrey-black leading-tight">
            The Collections
          </h2>
        </motion.div>

        {/* Collection cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-28">
          {collections.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="group cursor-pointer relative overflow-hidden"
            >
              <div
                className="h-80 md:h-96 transition-transform duration-700 group-hover:scale-105"
                style={{ background: col.bg }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-jorrey-black/70 to-transparent flex items-end p-8">
                <div>
                  <h3 className="font-serif text-2xl text-jorrey-white mb-2">
                    {col.name}
                  </h3>
                  <p className="text-jorrey-white/60 text-sm font-sans leading-relaxed mb-4">
                    {col.description}
                  </p>
                  <span className="text-jorrey-gold text-xs tracking-widest uppercase border-b border-jorrey-gold/50 pb-px group-hover:border-jorrey-gold transition-colors">
                    Explore →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Product grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
            Hand-Picked
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-jorrey-black">
            Featured Pieces
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
