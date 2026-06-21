"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Zap } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import ProductModal from "./ProductModal";
import type { Product } from "@/lib/product-types";
import { categoryHasSizes, isSkincareCat } from "@/lib/product-types";
import { useCart } from "./CartProvider";

export type { Product };

interface ProductCardProps {
  product: Product;
  whatsappNumber?: string;
  currencySymbol?: string;
}

export default function ProductCard({
  product,
  whatsappNumber = "",
  currencySymbol = "$",
}: ProductCardProps) {
  const t = useTranslations("cart");
  const tp = useTranslations("product");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { addItem } = useCart();
  const [modalOpen, setModalOpen] = useState(false);
  const [hoverImg, setHoverImg] = useState<string | null>(null);

  const images =
    product.images?.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

  const hasSizes = categoryHasSizes(product.category) && product.sizes.length > 0;

  const statusArr = product.status ?? [];
  const hasOnSale = statusArr.includes("On Sale");

  function quickAddToCart(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasSizes) {
      setModalOpen(true);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: hasOnSale && product.salePrice ? product.salePrice : product.price,
      sku: product.sku,
      color: product.color,
      size: tp("one_size"),
      image: images[0] ?? "",
      category: product.category,
    });
  }

  function quickBuyNow(e: React.MouseEvent) {
    e.stopPropagation();
    setModalOpen(true);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="group cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        {/* Image — aspectRatio in inline style ensures it's always applied */}
        <div
          className="relative overflow-hidden mb-4"
          style={{ aspectRatio: '3/4' }}
          onMouseEnter={() => images[1] && setHoverImg(images[1])}
          onMouseLeave={() => setHoverImg(null)}
        >
          {images[0] ? (
            <Image
              src={hoverImg ?? images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-all duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full transition-transform duration-700 group-hover:scale-105 bg-jorrey-beige" />
          )}

          {/* Badges — stacked column top-start, each routes to its collection page */}
          {statusArr.length > 0 && (
            <div className="absolute top-2 start-2 z-10 flex flex-col gap-1">
              {statusArr.includes("On Sale") && (
                <Link href="/sale" onClick={(e) => e.stopPropagation()} className="bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 hover:bg-red-700 transition-colors">
                  SALE
                </Link>
              )}
              {statusArr.includes("Featured") && (
                <Link href="/featured" onClick={(e) => e.stopPropagation()} className="bg-jorrey-black text-jorrey-gold text-[9px] font-bold tracking-widest uppercase px-2 py-1 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors">
                  FEATURED
                </Link>
              )}
              {statusArr.includes("New Arrival") && (
                <Link href="/new-arrival" onClick={(e) => e.stopPropagation()} className="bg-teal-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 hover:bg-teal-700 transition-colors">
                  NEW ARRIVAL
                </Link>
              )}
              {statusArr.includes("Clearance") && (
                <Link href="/clearance" onClick={(e) => e.stopPropagation()} className="bg-orange-500 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 hover:bg-orange-600 transition-colors">
                  CLEARANCE
                </Link>
              )}
              {statusArr.includes("Limited Edition") && (
                <Link href="/limited-edition" onClick={(e) => e.stopPropagation()} className="bg-jorrey-gold text-jorrey-black text-[9px] font-bold tracking-widest uppercase px-2 py-1 hover:bg-jorrey-gold-dark transition-colors">
                  LIMITED EDITION
                </Link>
              )}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-jorrey-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-end justify-end gap-2 p-3">
            {whatsappNumber && (
              <button
                onClick={quickBuyNow}
                className="flex items-center gap-1.5 bg-jorrey-gold text-jorrey-black text-[10px] tracking-widests uppercase px-4 py-2 font-semibold hover:bg-jorrey-gold-light transition-colors w-full justify-center"
              >
                <Zap size={11} />
                {t("buy_now")}
              </button>
            )}
            <button
              onClick={quickAddToCart}
              className="flex items-center gap-1.5 bg-jorrey-white text-jorrey-black text-[10px] tracking-widests uppercase px-4 py-2 font-semibold hover:bg-jorrey-beige transition-colors w-full justify-center"
            >
              <ShoppingBag size={11} />
              {t("add_to_bag")}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <p className="text-jorrey-black/40 text-[11px] tracking-widests uppercase font-sans">
            {product.category}
          </p>
          <h3 className="font-serif text-lg text-jorrey-black group-hover:text-jorrey-gold-dark transition-colors duration-300">
            {isRTL && product.nameAr ? product.nameAr : product.name}
          </h3>
          {isSkincareCat(product.category) && product.ml && (
            <p className="text-jorrey-black/50 text-[11px] tracking-widest uppercase font-sans">
              {product.ml} ML
            </p>
          )}
          {(product.summary || product.summaryAr) && (
            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
              {isRTL && product.summaryAr ? product.summaryAr : product.summary}
            </p>
          )}
          {hasOnSale && product.salePrice ? (
            <div className="flex items-center gap-2">
              <p className="text-red-600 text-sm font-sans tracking-wide font-medium">
                {currencySymbol}{product.salePrice.toLocaleString()}
              </p>
              <p className="text-jorrey-black/40 text-xs font-sans line-through">
                {currencySymbol}{product.price.toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-jorrey-black/70 text-sm font-sans tracking-wide">
              {currencySymbol}{product.price.toLocaleString()}
            </p>
          )}
        </div>
      </motion.div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
        whatsappNumber={whatsappNumber}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
