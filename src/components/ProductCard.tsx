"use client";

import { motion } from "framer-motion";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  bgColor: string;
  isNew?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group cursor-pointer"
    >
      {/* Image area */}
      <div className="relative overflow-hidden aspect-[3/4] mb-4">
        <div
          className="w-full h-full transition-transform duration-700 group-hover:scale-105"
          style={{ background: product.bgColor }}
        />

        {product.isNew && (
          <span className="absolute top-4 left-4 text-[10px] tracking-[0.2em] uppercase bg-jorrey-gold text-jorrey-black px-2.5 py-1 font-semibold">
            New
          </span>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-jorrey-black/20 flex items-end justify-center pb-8"
        >
          <button className="bg-jorrey-white text-jorrey-black text-xs tracking-[0.15em] uppercase px-8 py-3 hover:bg-jorrey-gold transition-colors duration-300 font-semibold">
            Add to Bag
          </button>
        </motion.div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <p className="text-jorrey-black/40 text-[11px] tracking-widest uppercase font-sans">
          {product.category}
        </p>
        <h3 className="font-serif text-lg text-jorrey-black group-hover:text-jorrey-gold-dark transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-jorrey-black/70 text-sm font-sans tracking-wide">
          ${product.price.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}
