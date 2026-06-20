"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/product-types";
import type { Category } from "@/lib/category-types";
import { isSkincareCat } from "@/lib/product-types";

interface Props {
  categories: Category[];
  products: Product[];
  whatsappNumber: string;
  currencySymbol: string;
}

// Standard checkbox — category rows + Clothing/SkinCare
function CatCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none group flex-1 min-w-0">
      <div
        onClick={() => onChange(!checked)}
        className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-colors ${
          checked
            ? "bg-jorrey-black border-jorrey-black"
            : "border-gray-300 group-hover:border-jorrey-black"
        }`}
      >
        {checked && <div className="w-1.5 h-1.5 bg-white" />}
      </div>
      <span
        onClick={() => onChange(!checked)}
        className="text-sm font-medium text-jorrey-black truncate"
      >
        {label}
      </span>
    </label>
  );
}

// Smaller checkbox — individual products inside dropdowns
function ProductCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group w-full">
      <div
        onClick={() => onChange(!checked)}
        className={`w-3 h-3 border flex-shrink-0 flex items-center justify-center transition-colors ${
          checked
            ? "bg-jorrey-black border-jorrey-black"
            : "border-gray-300 group-hover:border-jorrey-black"
        }`}
      >
        {checked && <div className="w-1 h-1 bg-white" />}
      </div>
      <span
        onClick={() => onChange(!checked)}
        className={`text-xs truncate transition-colors ${
          checked
            ? "text-jorrey-black font-semibold"
            : "text-gray-600 group-hover:text-jorrey-black"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// URL param keys
const P_CATS = "cats";
const P_PIDS = "pids";
const P_CLOTH = "clothing";
const P_SKIN = "skincare";

export default function ExploreClient({
  categories,
  products,
  whatsappNumber,
  currencySymbol,
}: Props) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Initialise state from URL params ──────────────────────────────────────
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => {
    const raw = searchParams.get(P_CATS);
    return raw ? new Set(raw.split(",").filter(Boolean)) : new Set<string>();
  });
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => {
    const raw = searchParams.get(P_PIDS);
    return raw ? new Set(raw.split(",").filter(Boolean)) : new Set<string>();
  });
  const [clothingFilter, setClothingFilter] = useState(
    () => searchParams.get(P_CLOTH) === "1"
  );
  const [skinCareFilter, setSkinCareFilter] = useState(
    () => searchParams.get(P_SKIN) === "1"
  );
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // ── Push current filter state to URL without adding a history entry ───────
  function pushUrl(
    cats: Set<string>,
    pids: Set<string>,
    clothing: boolean,
    skincare: boolean
  ) {
    const params = new URLSearchParams();
    if (cats.size > 0) params.set(P_CATS, [...cats].join(","));
    if (pids.size > 0) params.set(P_PIDS, [...pids].join(","));
    if (clothing) params.set(P_CLOTH, "1");
    if (skincare) params.set(P_SKIN, "1");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Group products by lower-cased category name
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const key = p.category.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [products]);

  // ── Filter handlers — compute next value, update state + URL together ─────
  function toggleCat(catName: string, checked: boolean) {
    const next = new Set(selectedCats);
    if (checked) next.add(catName.toLowerCase());
    else next.delete(catName.toLowerCase());
    setSelectedCats(next);
    pushUrl(next, selectedProductIds, clothingFilter, skinCareFilter);
  }

  function toggleProduct(id: string, checked: boolean) {
    const next = new Set(selectedProductIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedProductIds(next);
    pushUrl(selectedCats, next, clothingFilter, skinCareFilter);
  }

  function toggleClothing(v: boolean) {
    setClothingFilter(v);
    pushUrl(selectedCats, selectedProductIds, v, skinCareFilter);
  }

  function toggleSkinCare(v: boolean) {
    setSkinCareFilter(v);
    pushUrl(selectedCats, selectedProductIds, clothingFilter, v);
  }

  function toggleDropdown(catId: string) {
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function clearAll() {
    setSelectedCats(new Set());
    setSelectedProductIds(new Set());
    setClothingFilter(false);
    setSkinCareFilter(false);
    router.replace(pathname, { scroll: false });
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const hasAnyFilter =
    selectedCats.size > 0 ||
    selectedProductIds.size > 0 ||
    clothingFilter ||
    skinCareFilter;

  const filteredProducts = useMemo<Product[]>(() => {
    // Product-level selections override everything
    if (selectedProductIds.size > 0) {
      return products.filter((p) => selectedProductIds.has(p.id));
    }

    const noFilter =
      selectedCats.size === 0 && !clothingFilter && !skinCareFilter;
    if (noFilter) return products;

    const ids = new Set<string>();
    if (selectedCats.size > 0) {
      products
        .filter((p) => selectedCats.has(p.category.toLowerCase()))
        .forEach((p) => ids.add(p.id));
    }
    if (clothingFilter) {
      products
        .filter((p) => !isSkincareCat(p.category))
        .forEach((p) => ids.add(p.id));
    }
    if (skinCareFilter) {
      products
        .filter((p) => isSkincareCat(p.category))
        .forEach((p) => ids.add(p.id));
    }
    return products.filter((p) => ids.has(p.id));
  }, [products, selectedProductIds, selectedCats, clothingFilter, skinCareFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen bg-jorrey-white pt-28 pb-24"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Page header */}
        <div className="mb-12">
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
            {isRTL ? "استكشف" : "Explore"}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-jorrey-black leading-tight">
            {isRTL ? "كل المجموعات" : "All Collections"}
          </h1>
          <div className="w-12 h-px bg-jorrey-gold mt-6" />
        </div>

        <div
          className={`flex gap-10 items-start ${isRTL ? "flex-row-reverse" : ""}`}
        >
          {/* ── Desktop left sidebar ── */}
          <aside className="hidden md:block flex-shrink-0" style={{ width: 212 }}>
            <div className="sticky top-32">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400 font-medium">
                  {isRTL ? "تصفية" : "Browse"}
                </span>
                {hasAnyFilter && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[10px] text-jorrey-gold hover:text-jorrey-black tracking-widest uppercase transition-colors"
                  >
                    <X size={9} />
                    {isRTL ? "مسح" : "Clear all"}
                  </button>
                )}
              </div>

              <div className="space-y-px">
                {/* 1. Category rows */}
                {categories.map((cat) => {
                  const displayName = isRTL && cat.nameAr ? cat.nameAr : cat.name;
                  const catKey = cat.name.toLowerCase();
                  const catProducts = productsByCategory.get(catKey) ?? [];
                  const isCatChecked = selectedCats.has(catKey);
                  const isOpen = openDropdowns.has(cat.id);

                  return (
                    <div key={cat.id} className="border border-gray-100 bg-white">
                      <div className="flex items-center gap-2 px-3 py-3">
                        <CatCheck
                          label={displayName}
                          checked={isCatChecked}
                          onChange={(v) => toggleCat(cat.name, v)}
                        />
                        {catProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleDropdown(cat.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-jorrey-black transition-colors"
                            aria-label={isOpen ? "Collapse" : "Expand"}
                          >
                            {isOpen ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )}
                          </button>
                        )}
                      </div>

                      {isOpen && catProducts.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50/50">
                          {catProducts.map((p) => {
                            const pName = isRTL && p.nameAr ? p.nameAr : p.name;
                            return (
                              <div
                                key={p.id}
                                className={`flex items-center px-4 py-2 border-b border-gray-100/70 last:border-b-0 transition-colors ${
                                  selectedProductIds.has(p.id)
                                    ? "bg-jorrey-beige/20"
                                    : "hover:bg-white"
                                }`}
                              >
                                <ProductCheck
                                  label={pName}
                                  checked={selectedProductIds.has(p.id)}
                                  onChange={(v) => toggleProduct(p.id, v)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 2. Clothing filter */}
                <div
                  className={`border bg-white px-3 py-3 transition-colors ${
                    clothingFilter ? "border-jorrey-black" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <CatCheck
                    label={isRTL ? "ملابس" : "Clothing"}
                    checked={clothingFilter}
                    onChange={toggleClothing}
                  />
                </div>

                {/* 3. SkinCare filter */}
                <div
                  className={`border bg-white px-3 py-3 transition-colors ${
                    skinCareFilter ? "border-jorrey-black" : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <CatCheck
                    label={isRTL ? "العناية بالبشرة" : "SkinCare"}
                    checked={skinCareFilter}
                    onChange={toggleSkinCare}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Mobile filter chips ── */}
          <div className="md:hidden w-full mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const catKey = cat.name.toLowerCase();
              const isChecked = selectedCats.has(catKey);
              const displayName = isRTL && cat.nameAr ? cat.nameAr : cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCat(cat.name, !isChecked)}
                  className={`px-3 py-1.5 text-[11px] tracking-widest uppercase border transition-colors ${
                    isChecked
                      ? "bg-jorrey-black text-white border-jorrey-black"
                      : "border-gray-200 text-gray-600 hover:border-jorrey-black"
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => toggleClothing(!clothingFilter)}
              className={`px-3 py-1.5 text-[11px] tracking-widest uppercase border transition-colors ${
                clothingFilter
                  ? "bg-jorrey-black text-white border-jorrey-black"
                  : "border-gray-200 text-gray-600 hover:border-jorrey-black"
              }`}
            >
              {isRTL ? "ملابس" : "Clothing"}
            </button>
            <button
              type="button"
              onClick={() => toggleSkinCare(!skinCareFilter)}
              className={`px-3 py-1.5 text-[11px] tracking-widest uppercase border transition-colors ${
                skinCareFilter
                  ? "bg-jorrey-black text-white border-jorrey-black"
                  : "border-gray-200 text-gray-600 hover:border-jorrey-black"
              }`}
            >
              {isRTL ? "العناية بالبشرة" : "SkinCare"}
            </button>
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-[11px] tracking-widest uppercase border border-dashed border-gray-300 text-gray-400 hover:text-jorrey-black transition-colors"
              >
                {isRTL ? "مسح" : "Clear"}
              </button>
            )}
          </div>

          {/* ── Product grid ── */}
          <div className="flex-1 min-w-0">
            {selectedProductIds.size > 0 && (
              <p className="text-xs text-gray-400 mb-6 tracking-wide">
                {isRTL
                  ? `عرض ${selectedProductIds.size} منتج محدد`
                  : `Showing ${selectedProductIds.size} selected product${selectedProductIds.size !== 1 ? "s" : ""}`}
              </p>
            )}

            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 text-sm">
                  {isRTL ? "لا توجد منتجات مطابقة." : "No products match the selection."}
                </p>
                {hasAnyFilter && (
                  <button
                    onClick={clearAll}
                    className="mt-4 text-xs text-jorrey-gold hover:text-jorrey-black tracking-widest uppercase transition-colors"
                  >
                    {isRTL ? "مسح الكل" : "Clear All"}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    whatsappNumber={whatsappNumber}
                    currencySymbol={currencySymbol}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
