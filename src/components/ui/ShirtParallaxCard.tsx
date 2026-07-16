"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShirtParallaxCardProps {
  title: string;
  description: string;
  price: string;
  /** Original price before discount — shown struck-through when provided */
  originalPrice?: string;
  imageUrl?: string;
  buyNowLabel?: string;
  onBuyNow?: () => void;
  /** Badges rendered inside the card at the upper-start corner (RTL-aware via start-3) */
  badgeSlot?: React.ReactNode;
  /** Heart + bell row directly below the product image */
  actionSlot?: React.ReactNode;
  /** Shipping line shown below the price (e.g. "Free Shipping" or "Shipping: $10") */
  shippingLabel?: string;
  /** Color swatches shown between price and shipping */
  colorsDisplay?: React.ReactNode;
  /** Called when the product image area is clicked */
  onImageClick?: () => void;
  className?: string;
}

export function ShirtParallaxCard({
  title,
  description,
  price,
  originalPrice,
  imageUrl,
  buyNowLabel = "Buy Now",
  onBuyNow,
  badgeSlot,
  actionSlot,
  shippingLabel,
  colorsDisplay,
  onImageClick,
  className,
}: ShirtParallaxCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 0.97, boxShadow: "0px 15px 35px rgba(0,0,0,0.18)" }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className={cn(
        "relative w-full cursor-pointer rounded-2xl overflow-hidden bg-white border border-jorrey-beige-dark shadow-sm",
        className
      )}
    >
      {/* ── Product image ── */}
      <div
        className={cn(
          "relative w-full aspect-[3/4] overflow-hidden bg-jorrey-beige",
          onImageClick && "cursor-pointer"
        )}
        onClick={onImageClick}
        role={onImageClick ? "button" : undefined}
        tabIndex={onImageClick ? 0 : undefined}
        onKeyDown={onImageClick ? (e) => e.key === "Enter" && onImageClick() : undefined}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-jorrey-gold/20 via-jorrey-beige to-jorrey-beige-dark" />
        )}

        {/* Badges — upper-start corner inside the image (start-3 = left in LTR, right in RTL) */}
        {badgeSlot && (
          <div className="absolute top-3 start-3 z-20 flex flex-col gap-1 items-start">
            {badgeSlot}
          </div>
        )}
      </div>

      {/* ── Heart / Bell row — below image, no overlap ── */}
      {actionSlot && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-jorrey-beige-dark">
          {actionSlot}
        </div>
      )}

      {/* ── Text + CTA ── */}
      <div className="p-5 space-y-1.5">
        <h3 className="font-serif text-lg font-bold text-jorrey-black leading-snug">{title}</h3>
        <p className="text-sm text-jorrey-black/55 line-clamp-3 leading-relaxed">{description}</p>
        <div className="flex items-center gap-2 pt-1">
          <p className={`text-base font-semibold ${originalPrice ? "text-red-600" : "text-jorrey-black"}`}>
            {price}
          </p>
          {originalPrice && (
            <p className="text-sm text-gray-400 line-through">{originalPrice}</p>
          )}
        </div>
        {colorsDisplay}
        {shippingLabel && (
          <p className="text-[11px] text-teal-600 font-medium tracking-wide uppercase">
            {shippingLabel}
          </p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
          className="mt-2 w-full bg-jorrey-black text-jorrey-white text-[11px] tracking-widest uppercase font-semibold py-3 px-4 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors duration-200 rounded-lg"
        >
          {buyNowLabel}
        </button>
      </div>
    </motion.div>
  );
}
