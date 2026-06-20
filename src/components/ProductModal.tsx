"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ShoppingBag, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useCart } from "./CartProvider";
import CheckoutModal from "./CheckoutModal";
import type { Product } from "@/lib/product-types";
import { categoryHasSizes } from "@/lib/product-types";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  whatsappNumber?: string;
  currencySymbol?: string;
}

export default function ProductModal({
  product,
  open,
  onClose,
  whatsappNumber = "",
  currencySymbol = "$",
}: Props) {
  const { addItem } = useCart();
  const t = useTranslations("cart");
  const tp = useTranslations("product");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [currentImg, setCurrentImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  // Reset all local state each time this modal opens or the product changes
  useEffect(() => {
    if (open) {
      setCurrentImg(0);
      setSelectedSize("");
      setSizeError(false);
    }
  }, [open, product.id]);

  const images =
    product.images?.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

  const hasSizes = categoryHasSizes(product.category) && product.sizes.length > 0;

  // Pick locale-aware display strings
  const displayName    = isRTL && product.nameAr        ? product.nameAr        : product.name;
  const displaySummary = isRTL && product.summaryAr     ? product.summaryAr     : product.summary;
  const displayDesc    = isRTL && product.descriptionAr ? product.descriptionAr : product.description;

  function handleAddToCart() {
    if (hasSizes && !selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addItem({
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: product.onSale && product.salePrice ? product.salePrice : product.price,
      sku: product.sku,
      color: product.color,
      size: hasSizes ? selectedSize : tp("one_size"),
      image: images[0] ?? "",
      category: product.category,
    });
    onClose();
  }

  function handleBuyNow() {
    if (hasSizes && !selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    setBuyNowOpen(true);
  }

  // Single-item payload forwarded to the WhatsApp checkout form
  const checkoutItems = [{
    cartId: "modal-preview",
    productId: product.id,
    name: product.name,
    nameAr: product.nameAr,
    price: product.onSale && product.salePrice ? product.salePrice : product.price,
    sku: product.sku,
    color: product.color,
    size: hasSizes ? selectedSize : tp("one_size"),
    image: images[0] ?? "",
    quantity: 1,
    category: product.category,
  }];

  const prevImg = () => setCurrentImg((i) => Math.max(0, i - 1));
  const nextImg = () => setCurrentImg((i) => Math.min(images.length - 1, i + 1));

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogPortal>
          {/* Dark overlay */}
          <DialogOverlay />

          {/*
           * Popup sizing strategy
           * ─────────────────────
           * Mobile  (<md)  : full-screen overlay, outer scrolls so long descriptions work
           * Desktop (≥md)  : centered at 90 vw × 90 vh, hard-capped at 1 400 px wide
           *                  overflow-hidden because each column manages its own scroll
           */}
          <DialogPrimitive.Popup
            className={cn(
              "fixed z-50 bg-white shadow-2xl outline-none",
              // Mobile: full screen
              "inset-0 overflow-y-auto",
              // Desktop: centred card
              "md:inset-auto",
              "md:top-1/2 md:left-1/2",
              "md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-[90vw] md:max-w-[1400px]",
              "md:h-[90vh]",
              "md:overflow-hidden",
              // Animations (base-ui sets data-open / data-closed attributes)
              "duration-200",
              "data-open:animate-in data-open:fade-in-0",
              "data-closed:animate-out data-closed:fade-out-0",
            )}
          >
            {/*
             * Inner flex container
             * Mobile : single column  — image on top (order-1), info below (order-2)
             * Desktop: two columns    — info on left (order-1), image on right (order-2)
             */}
            <div className="flex flex-col md:flex-row md:h-full">

              {/* ══════════════════════════════════════════════
                  LEFT PANEL — product info
                  Desktop: 38 % wide, fixed height = 90 vh,
                            header + scrollable body + sticky footer
                  Mobile : natural height, sits below the image
                  ══════════════════════════════════════════════ */}
              <div
                className={cn(
                  // Mobile: second (below image)
                  "order-2",
                  // Desktop: first (left column), full panel height
                  "md:order-1 md:w-[38%] md:h-full md:flex-shrink-0",
                  "flex flex-col",
                  "border-e border-gray-100",
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {/* ── Sticky header: category + close ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase">
                    {product.category}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">
                  {/* Name + price */}
                  <div>
                    <div className="flex items-start gap-2 mb-3">
                      <h2 className="font-serif text-2xl lg:text-[1.75rem] text-[#0C0C0C] leading-snug flex-1">
                        {displayName}
                      </h2>
                      {product.onSale && (
                        <span className="flex-shrink-0 bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1 mt-1">
                          SALE
                        </span>
                      )}
                    </div>
                    {product.onSale && product.salePrice ? (
                      <div className="flex items-center gap-3">
                        <p className="text-[1.15rem] text-red-600 font-medium tracking-wide">
                          {currencySymbol}{product.salePrice.toLocaleString()}
                        </p>
                        <p className="text-base text-gray-400 font-light line-through">
                          {currencySymbol}{product.price.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[1.15rem] text-[#0C0C0C] font-light tracking-wide">
                        {currencySymbol}{product.price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  {displaySummary && (
                    <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-5">
                      {displaySummary}
                    </p>
                  )}

                  {/* Color + SKU */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs border-t border-gray-100 pt-4">
                    {product.color &&
                      product.color !== "NA" &&
                      product.color !== "N/A" && (
                        <span className="text-gray-600">
                          <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 me-1.5">
                            {tp("color")}
                          </span>
                          {product.color}
                        </span>
                      )}
                    <span className="text-gray-600">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 me-1.5">
                        {tp("sku")}
                      </span>
                      {product.sku}
                    </span>
                  </div>

                  {/* Size picker — hidden for SkinCare / Accessories */}
                  {hasSizes && (
                    <div className="border-t border-gray-100 pt-4">
                      <p
                        className={cn(
                          "text-[10px] tracking-[0.2em] uppercase mb-3",
                          sizeError ? "text-red-500" : "text-gray-500",
                        )}
                      >
                        {tp("select_size")}
                        {sizeError && (
                          <span className="ms-2 normal-case tracking-normal font-normal">
                            — {tp("size_required")}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setSelectedSize(s); setSizeError(false); }}
                            className={cn(
                              "px-4 py-2 text-xs border transition-all duration-150",
                              selectedSize === s
                                ? "border-[#0C0C0C] bg-[#0C0C0C] text-white"
                                : "border-gray-200 text-gray-700 hover:border-[#0C0C0C]",
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full description */}
                  {displayDesc && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-3">
                        {tp("details")}
                      </p>
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {displayDesc}
                      </div>
                    </div>
                  )}

                  {/* Spacer — keeps buttons at bottom when content is short */}
                  <div className="flex-1 min-h-6" />
                </div>

                {/* ── Sticky CTA footer — always visible ── */}
                <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 space-y-2.5 bg-white">
                  {whatsappNumber && (
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full flex items-center justify-center gap-2 bg-[#C9A96E] text-[#0C0C0C] text-[11px] tracking-[0.2em] uppercase font-semibold py-3.5 hover:bg-[#E2C99A] transition-colors"
                    >
                      <Zap size={13} />
                      {t("buy_now")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 bg-[#0C0C0C] text-white text-[11px] tracking-[0.2em] uppercase font-semibold py-3.5 hover:bg-[#C9A96E] hover:text-[#0C0C0C] transition-colors"
                  >
                    <ShoppingBag size={13} />
                    {t("add_to_bag")}
                  </button>
                </div>
              </div>

              {/* ══════════════════════════════════════════════
                  RIGHT PANEL — image carousel
                  Desktop: fills remaining width, full 90 vh height
                  Mobile : first (above info), 4:5 aspect ratio
                  ══════════════════════════════════════════════ */}
              <div
                className={cn(
                  // Mobile: first (above info)
                  "order-1",
                  // Desktop: second (right column), takes remaining width
                  "md:order-2 md:flex-1",
                  "bg-[#EDE8DE] flex flex-col",
                  "md:h-full",
                )}
              >
                {/* Main image area
                    height via inline style so it's always in DOM (Turbopack
                    doesn't reliably compile arbitrary Tailwind classes).
                    On desktop md:flex-1 overrides the height via flex-basis:0% */}
                <div
                  className="relative overflow-hidden md:flex-1"
                  style={{ height: 'min(80vw, 80vh)' }}
                >
                  {images.length > 0 ? (
                    <Image
                      src={images[currentImg]}
                      alt={displayName}
                      fill
                      sizes="(max-width: 768px) 100vw, 62vw"
                      className="object-contain"
                      preload
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}

                  {/* Previous / Next arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImg}
                        disabled={currentImg === 0}
                        aria-label="Previous image"
                        className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white flex items-center justify-center transition-colors disabled:opacity-0 z-10"
                      >
                        {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={nextImg}
                        disabled={currentImg === images.length - 1}
                        aria-label="Next image"
                        className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white flex items-center justify-center transition-colors disabled:opacity-0 z-10"
                      >
                        {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </>
                  )}

                  {/* Dot progress bar */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentImg(i)}
                          aria-label={`Image ${i + 1}`}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-200",
                            i === currentImg
                              ? "w-6 bg-[#C9A96E]"
                              : "w-1.5 bg-white/60 hover:bg-white/90",
                          )}
                        />
                      ))}
                    </div>
                  )}

                  {/* Image counter badge */}
                  {images.length > 1 && (
                    <div className="absolute top-3 end-3 bg-black/40 text-white text-[10px] tracking-widest px-2 py-1 z-10">
                      {currentImg + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3 flex-shrink-0 border-t border-[#D5CFC4]/60">
                    {images.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentImg(i)}
                        className={cn(
                          "flex-shrink-0 w-[3.25rem] h-[3.25rem] overflow-hidden transition-all duration-150",
                          i === currentImg
                            ? "ring-2 ring-[#C9A96E] opacity-100"
                            : "opacity-45 hover:opacity-75",
                        )}
                      >
                        <div className="relative w-full h-full overflow-hidden" style={{ height: '3.25rem' }}>
                          <Image src={url} alt="" fill sizes="52px" className="object-cover" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>

      <CheckoutModal
        open={buyNowOpen}
        onClose={() => setBuyNowOpen(false)}
        items={checkoutItems}
        whatsappNumber={whatsappNumber}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
