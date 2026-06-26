"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Bell } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { ShirtParallaxCard } from "@/components/ui/ShirtParallaxCard";
import ProductModal from "./ProductModal";
import type { Product } from "@/lib/product-types";
import { categoryHasSizes, isLiquidCat, PRODUCT_COLORS } from "@/lib/product-types";
import { useCart } from "./CartProvider";
import { useUserLists } from "./UserListsProvider";

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
  const tp = useTranslations("product");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { addItem } = useCart();
  const { user } = useUser();
  const { isFavorite, isWatched, toggleFavorite, toggleWatchlist } = useUserLists();
  const [modalOpen, setModalOpen] = useState(false);

  const images =
    product.images?.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

  const hasSizes = categoryHasSizes(product.category) && product.sizes.length > 0;
  const statusArr = product.status ?? [];
  const hasOnSale = statusArr.includes("On Sale");
  const effectivePrice = hasOnSale && product.salePrice ? product.salePrice : product.price;
  const isOutOfStock = product.inStock === false;

  const priceDisplay = hasOnSale && product.salePrice
    ? `${currencySymbol}${product.salePrice.toLocaleString()}`
    : `${currencySymbol}${product.price.toLocaleString()}`;

  const descriptionText = isRTL && product.summaryAr
    ? product.summaryAr
    : product.summary
    || (isLiquidCat(product.category) && product.ml ? `${product.ml} ML` : "")
    || product.description
    || "";

  // Color swatches
  const productColors = product.colors?.length ? product.colors : (product.color && product.color !== "N/A" ? [product.color] : []);
  const colorsDisplay = productColors.length > 1 ? (
    <div className="flex items-center gap-1 pt-0.5">
      <span className="text-[9px] uppercase tracking-widest text-gray-400 me-1">{tp("available_colors")}</span>
      {productColors.slice(0, 6).map((name) => {
        const c = PRODUCT_COLORS.find((x) => x.name === name);
        return c ? (
          <span
            key={name}
            title={name}
            className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: c.hex }}
          />
        ) : null;
      })}
      {productColors.length > 6 && (
        <span className="text-[9px] text-gray-400">+{productColors.length - 6}</span>
      )}
    </div>
  ) : null;

  // Shipping display — show "Free Shipping" when cost is 0 or not set
  const shippingLabel =
    !product.shippingCost || product.shippingCost === 0
      ? tp("free_shipping")
      : `${tp("shipping_label")}: ${currencySymbol}${product.shippingCost.toLocaleString()}`;

  function handleBuyNow() {
    if (isOutOfStock) return;
    setModalOpen(true);
  }

  function handleAddToCart() {
    if (isOutOfStock) return;
    if (hasSizes) { setModalOpen(true); return; }
    addItem({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: effectivePrice,
      sku: product.sku,
      color: product.color,
      size: tp("one_size"),
      image: images[0] ?? "",
      category: product.category,
    });
  }

  void handleAddToCart; // available for future use

  // ── Badges — bilingual text, rendered inside card at upper-start corner ──
  const badges = (
    <>
      {isOutOfStock ? (
        <span className="bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm">
          {tp("badge_out_of_stock")}
        </span>
      ) : (
        <>
          {statusArr.includes("On Sale") && (
            <Link href="/sale" onClick={(e) => e.stopPropagation()}
              className="bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm hover:bg-red-700 transition-colors">
              {tp("badge_sale")}
            </Link>
          )}
          {statusArr.includes("New Arrival") && (
            <Link href="/new-arrival" onClick={(e) => e.stopPropagation()}
              className="bg-teal-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm hover:bg-teal-700 transition-colors">
              {tp("badge_new_arrival")}
            </Link>
          )}
          {statusArr.includes("Featured") && (
            <Link href="/featured" onClick={(e) => e.stopPropagation()}
              className="bg-jorrey-black text-jorrey-gold text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm hover:bg-jorrey-gold hover:text-jorrey-black transition-colors">
              {tp("badge_featured")}
            </Link>
          )}
          {statusArr.includes("Clearance") && (
            <Link href="/clearance" onClick={(e) => e.stopPropagation()}
              className="bg-orange-500 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm hover:bg-orange-600 transition-colors">
              {tp("badge_clearance")}
            </Link>
          )}
          {statusArr.includes("Limited Edition") && (
            <Link href="/limited-edition" onClick={(e) => e.stopPropagation()}
              className="bg-jorrey-gold text-jorrey-black text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm hover:bg-jorrey-gold-dark transition-colors">
              {tp("badge_limited")}
            </Link>
          )}
        </>
      )}
    </>
  );

  // ── Icons rendered below the product image ────────────────────────────────
  const actions = user ? (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id, product.name); }}
        aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
        className={`w-8 h-8 rounded-full bg-jorrey-beige flex items-center justify-center hover:bg-jorrey-beige-dark transition-colors ${
          isFavorite(product.id) ? "text-red-500" : "text-jorrey-black/40 hover:text-red-400"
        }`}
      >
        <Heart size={14} fill={isFavorite(product.id) ? "currentColor" : "none"} strokeWidth={isFavorite(product.id) ? 0 : 2} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); toggleWatchlist(product.id, product.name, effectivePrice); }}
        aria-label={isWatched(product.id) ? "Remove from watchlist" : "Add to watchlist"}
        className={`w-8 h-8 rounded-full bg-jorrey-beige flex items-center justify-center hover:bg-jorrey-beige-dark transition-colors ${
          isWatched(product.id) ? "text-jorrey-gold" : "text-jorrey-black/40 hover:text-jorrey-gold"
        } ${isOutOfStock ? "ring-2 ring-jorrey-gold/40" : ""}`}
      >
        <Bell size={14} fill={isWatched(product.id) ? "currentColor" : "none"} strokeWidth={isWatched(product.id) ? 0 : 2} />
      </button>
      {isOutOfStock && (
        <span className="text-[10px] text-jorrey-black/40 ms-1">Notify me</span>
      )}
    </div>
  ) : null;

  return (
    <>
      <ShirtParallaxCard
        title={isRTL && product.nameAr ? product.nameAr : product.name}
        description={descriptionText}
        price={priceDisplay}
        imageUrl={images[0]}
        buyNowLabel={isOutOfStock ? tp("badge_out_of_stock") : (isRTL ? "اشترِ الآن" : "Buy Now")}
        onBuyNow={handleBuyNow}
        onImageClick={() => setModalOpen(true)}
        badgeSlot={badges}
        actionSlot={actions}
        colorsDisplay={colorsDisplay}
        shippingLabel={shippingLabel}
        className={isOutOfStock ? "opacity-60 grayscale-[25%]" : ""}
      />

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
        whatsappNumber={isOutOfStock ? "" : whatsappNumber}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
