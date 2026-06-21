"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/product-types";
import type { Category } from "@/lib/category-types";
import { SKINCARE_TYPES } from "@/lib/product-types";

interface Props {
  category: Category;
  products: Product[];
  whatsappNumber: string;
  currencySymbol: string;
}

function isSkincareCat(cat: Category) {
  return cat.slug.toLowerCase() === "skincare" ||
    cat.name.toLowerCase().replace(/\s/g, "") === "skincare";
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 mb-2 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left px-3 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-jorrey-black">{title}</span>
        {open ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-2.5 bg-white border-t border-gray-100">{children}</div>}
    </div>
  );
}

function FilterCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      <div
        className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? "bg-jorrey-black border-jorrey-black" : "border-gray-300 group-hover:border-jorrey-black"
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && <div className="w-1.5 h-1.5 bg-white" />}
      </div>
      <span
        className="text-sm text-gray-600 group-hover:text-jorrey-black transition-colors"
        onClick={() => onChange(!checked)}
      >
        {label}
      </span>
    </label>
  );
}

export default function CategoryClient({ category, products, whatsappNumber, currencySymbol }: Props) {
  const t = useTranslations("category");
  const tf = useTranslations("filters");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const skincare = isSkincareCat(category);
  const filtersEnabled = category.filtersEnabled !== false;

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedSkincareTypes, setSelectedSkincareTypes] = useState<string[]>([]);

  // Derive available options from all products
  const allSizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes))].sort(),
    [products]
  );
  const allColors = useMemo(
    () =>
      [...new Set(
        products
          .map((p) => p.color)
          .filter((c) => c && !["N/A", "NA", "n/a", "na"].includes(c))
      )],
    [products]
  );
  const allPatterns = useMemo(
    () => [...new Set(products.map((p) => p.pattern).filter(Boolean) as string[])],
    [products]
  );
  const allProductTypes = useMemo(
    () => [...new Set(products.map((p) => p.productType).filter(Boolean) as string[])],
    [products]
  );

  // Translated skincare type labels
  const skincareTypeLabels: Record<string, string> = {
    "Cleanser": tf("cleanser"),
    "Exfoliant": tf("exfoliant"),
    "Serum": tf("serum"),
    "Moisturizers": tf("moisturizers"),
    "Creams": tf("creams"),
    "Skin Brightening": tf("skin_brightening"),
    "SPF": tf("spf"),
  };

  // Filter logic
  const filteredProducts = useMemo(() => {
    let result = products;
    if (skincare) {
      if (selectedSkincareTypes.length > 0) {
        result = result.filter(
          (p) => p.skincareType && selectedSkincareTypes.includes(p.skincareType)
        );
      }
    } else {
      if (selectedSizes.length > 0) {
        result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
      }
      if (selectedColors.length > 0) {
        result = result.filter((p) => selectedColors.includes(p.color));
      }
      if (selectedPatterns.length > 0) {
        result = result.filter((p) => p.pattern && selectedPatterns.includes(p.pattern));
      }
      if (selectedProductTypes.length > 0) {
        result = result.filter((p) => p.productType && selectedProductTypes.includes(p.productType));
      }
      if (maxPrice && !isNaN(Number(maxPrice)) && Number(maxPrice) > 0) {
        const max = Number(maxPrice);
        result = result.filter((p) => {
          const effective = p.status?.includes("On Sale") && p.salePrice ? p.salePrice : p.price;
          return effective <= max;
        });
      }
      if (inStockOnly) {
        result = result.filter((p) => p.inStock !== false);
      }
    }
    return result;
  }, [
    products,
    skincare,
    selectedSizes,
    selectedColors,
    selectedPatterns,
    selectedProductTypes,
    maxPrice,
    inStockOnly,
    selectedSkincareTypes,
  ]);

  const activeFilterCount =
    selectedSizes.length +
    selectedColors.length +
    selectedPatterns.length +
    selectedProductTypes.length +
    selectedSkincareTypes.length +
    (maxPrice ? 1 : 0) +
    (inStockOnly ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  function toggle(
    arr: string[],
    setArr: (v: string[]) => void,
    value: string,
    checked: boolean
  ) {
    setArr(checked ? [...arr, value] : arr.filter((v) => v !== value));
  }

  function clearAll() {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPatterns([]);
    setSelectedProductTypes([]);
    setMaxPrice("");
    setInStockOnly(false);
    setSelectedSkincareTypes([]);
  }

  const description = isRTL && category.descriptionAr
    ? category.descriptionAr
    : category.description;
  const displayName = isRTL && category.nameAr ? category.nameAr : category.name;

  const filterPanelContent = (
    <div>
      {/* Description */}
      {description && (
        <div className={`pb-4 ${filtersEnabled ? "border-b border-gray-100 mb-1" : ""}`}>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Skincare type filters */}
      {filtersEnabled && skincare && (
        <FilterSection title={tf("skincare_type")}>
          {SKINCARE_TYPES.map((type) => (
            <FilterCheck
              key={type}
              label={skincareTypeLabels[type] ?? type}
              checked={selectedSkincareTypes.includes(type)}
              onChange={(c) => toggle(selectedSkincareTypes, setSelectedSkincareTypes, type, c)}
            />
          ))}
        </FilterSection>
      )}

      {/* Fashion filters */}
      {filtersEnabled && !skincare && (
        <>
          {allSizes.length > 0 && (
            <FilterSection title={tf("size")}>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      toggle(
                        selectedSizes,
                        setSelectedSizes,
                        size,
                        !selectedSizes.includes(size)
                      )
                    }
                    className={`px-3 py-1 text-xs border transition-colors ${
                      selectedSizes.includes(size)
                        ? "bg-jorrey-black text-white border-jorrey-black"
                        : "border-gray-200 text-gray-600 hover:border-jorrey-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {allColors.length > 0 && (
            <FilterSection title={tf("color")}>
              {allColors.map((color) => (
                <FilterCheck
                  key={color}
                  label={color}
                  checked={selectedColors.includes(color)}
                  onChange={(c) => toggle(selectedColors, setSelectedColors, color, c)}
                />
              ))}
            </FilterSection>
          )}

          {allPatterns.length > 0 && (
            <FilterSection title={tf("pattern")}>
              {allPatterns.map((pattern) => (
                <FilterCheck
                  key={pattern}
                  label={pattern}
                  checked={selectedPatterns.includes(pattern)}
                  onChange={(c) => toggle(selectedPatterns, setSelectedPatterns, pattern, c)}
                />
              ))}
            </FilterSection>
          )}

          {allProductTypes.length > 0 && (
            <FilterSection title={tf("product_type")}>
              {allProductTypes.map((pt) => (
                <FilterCheck
                  key={pt}
                  label={pt}
                  checked={selectedProductTypes.includes(pt)}
                  onChange={(c) => toggle(selectedProductTypes, setSelectedProductTypes, pt, c)}
                />
              ))}
            </FilterSection>
          )}

          <FilterSection title={tf("price")}>
            <div className="space-y-2">
              <p className="text-xs text-gray-400">{tf("max_price")}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">{currencySymbol}</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="—"
                  min="0"
                  className="border border-gray-200 text-sm px-2 py-1 w-20 focus:outline-none focus:border-jorrey-black"
                />
                {maxPrice && (
                  <button onClick={() => setMaxPrice("")} className="text-gray-400 hover:text-gray-600">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </FilterSection>

          <FilterSection title={tf("availability")}>
            <FilterCheck
              label={tf("in_stock")}
              checked={inStockOnly}
              onChange={(c) => setInStockOnly(c)}
            />
          </FilterSection>
        </>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-jorrey-white pt-28 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Page header */}
        <div className="mb-12">
          <p className="text-jorrey-gold text-xs tracking-[0.35em] uppercase mb-4">
            {t("collection")}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-jorrey-black leading-tight">
            {displayName}
          </h1>
          <div className="w-12 h-px bg-jorrey-gold mt-6" />
        </div>

        {/* Mobile: description shown above filter toggle */}
        {description && (
          <div className="md:hidden mb-5">
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Mobile filter toggle */}
        {filtersEnabled && (
          <div className="md:hidden mb-6">
            <button
              type="button"
              onClick={() => setShowMobileFilters((o) => !o)}
              className="flex items-center gap-2 text-xs tracking-widest uppercase border border-gray-200 px-4 py-2.5 hover:border-jorrey-black transition-colors"
            >
              <SlidersHorizontal size={13} />
              {t("filter_title")}
              {activeFilterCount > 0 && (
                <span className="bg-jorrey-black text-white text-[9px] font-bold px-1.5 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showMobileFilters && (
              <div className="mt-3 border border-gray-100 bg-white p-5">
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] text-jorrey-gold hover:text-jorrey-black tracking-widest uppercase transition-colors mb-4 block"
                  >
                    {t("clear_filters")}
                  </button>
                )}
                {/* Filters only (description already shown above) */}
                <div>
                  {filtersEnabled && skincare && (
                    <FilterSection title={tf("skincare_type")}>
                      {SKINCARE_TYPES.map((type) => (
                        <FilterCheck
                          key={type}
                          label={skincareTypeLabels[type] ?? type}
                          checked={selectedSkincareTypes.includes(type)}
                          onChange={(c) => toggle(selectedSkincareTypes, setSelectedSkincareTypes, type, c)}
                        />
                      ))}
                    </FilterSection>
                  )}
                  {filtersEnabled && !skincare && (
                    <>
                      {allSizes.length > 0 && (
                        <FilterSection title={tf("size")}>
                          <div className="flex flex-wrap gap-2">
                            {allSizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => toggle(selectedSizes, setSelectedSizes, size, !selectedSizes.includes(size))}
                                className={`px-3 py-1 text-xs border transition-colors ${selectedSizes.includes(size) ? "bg-jorrey-black text-white border-jorrey-black" : "border-gray-200 text-gray-600 hover:border-jorrey-black"}`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </FilterSection>
                      )}
                      {allColors.length > 0 && (
                        <FilterSection title={tf("color")}>
                          {allColors.map((color) => (
                            <FilterCheck key={color} label={color} checked={selectedColors.includes(color)} onChange={(c) => toggle(selectedColors, setSelectedColors, color, c)} />
                          ))}
                        </FilterSection>
                      )}
                      {allPatterns.length > 0 && (
                        <FilterSection title={tf("pattern")}>
                          {allPatterns.map((p) => (
                            <FilterCheck key={p} label={p} checked={selectedPatterns.includes(p)} onChange={(c) => toggle(selectedPatterns, setSelectedPatterns, p, c)} />
                          ))}
                        </FilterSection>
                      )}
                      {allProductTypes.length > 0 && (
                        <FilterSection title={tf("product_type")}>
                          {allProductTypes.map((pt) => (
                            <FilterCheck key={pt} label={pt} checked={selectedProductTypes.includes(pt)} onChange={(c) => toggle(selectedProductTypes, setSelectedProductTypes, pt, c)} />
                          ))}
                        </FilterSection>
                      )}
                      <FilterSection title={tf("price")}>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400">{tf("max_price")}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">{currencySymbol}</span>
                            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="—" min="0" className="border border-gray-200 text-sm px-2 py-1 w-20 focus:outline-none focus:border-jorrey-black" />
                            {maxPrice && <button onClick={() => setMaxPrice("")} className="text-gray-400 hover:text-gray-600"><X size={11} /></button>}
                          </div>
                        </div>
                      </FilterSection>
                      <FilterSection title={tf("availability")}>
                        <FilterCheck label={tf("in_stock")} checked={inStockOnly} onChange={(c) => setInStockOnly(c)} />
                      </FilterSection>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`flex gap-10 ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Desktop filter sidebar — always rendered */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="sticky top-32">
              {filtersEnabled && (
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 font-medium flex items-center gap-1.5">
                    <SlidersHorizontal size={10} />
                    {t("filter_title")}
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] text-jorrey-gold hover:text-jorrey-black tracking-widest uppercase transition-colors"
                    >
                      {t("clear_filters")}
                    </button>
                  )}
                </div>
              )}
              {filterPanelContent}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-400 text-sm">
                  {hasActiveFilters ? t("no_results") : t("empty")}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="mt-4 text-xs text-jorrey-gold hover:text-jorrey-black tracking-widest uppercase transition-colors"
                  >
                    {t("clear_filters")}
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
