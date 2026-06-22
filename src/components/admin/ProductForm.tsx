"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploadMultiple from "./ImageUploadMultiple";
import {
  SIZES,
  SKINCARE_TYPES,
  PRODUCT_COLORS,
  STATUS_OPTIONS,
  categoryHasSizes,
  isSkincareCat,
  isLiquidCat,
  type Product,
} from "@/lib/product-types";
import type { Category } from "@/lib/category-types";

const schema = z
  .object({
    name: z.string().min(1, "Required"),
    nameAr: z.string().optional(),
    summary: z.string(),
    summaryAr: z.string().optional(),
    description: z.string().min(1, "Required"),
    descriptionAr: z.string().optional(),
    price: z.number().positive("Must be positive"),
    category: z.string().min(1, "Required"),
    color: z.string(),
    sku: z.string().min(1, "Required"),
    sizes: z.array(z.string()),
    images: z.array(z.string()),
    status: z.array(z.string()),
    salePrice: z.number().optional(),
    skincareType: z.string().optional(),
    ml: z.number().optional(),
    pattern: z.string().optional(),
    productType: z.string().optional(),
    inStock: z.boolean(),
  })
  .refine(
    (d) =>
      !d.status.includes("On Sale") ||
      (d.salePrice != null && d.salePrice > 0 && d.salePrice < d.price),
    {
      message: "Sale price must be set and less than the original price",
      path: ["salePrice"],
    }
  )
  .superRefine((d, ctx) => {
    if (d.category && categoryHasSizes(d.category) && d.sizes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one size is required for this category",
        path: ["sizes"],
      });
    }
    if (d.category && isLiquidCat(d.category) && (!d.ml || d.ml <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing required field: Bottle Size (ML)",
        path: ["ml"],
      });
    }
    if (d.category && isSkincareCat(d.category) && !d.skincareType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required for SkinCare products",
        path: ["skincareType"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

const LIGHT_HEXES = new Set([
  "#FFFFFF",
  "#FFFAF0",
  "#FFF8E7",
  "#E8DCC8",
  "#C2B280",
  "#BFA882",
  "#9CA3AF",
  "#FDA4AF",
  "#38BDF8",
]);
function isLightHex(hex: string) {
  return LIGHT_HEXES.has(hex);
}

interface ProductFormProps {
  product?: Product;
  categories?: Category[];
}

export default function ProductForm({ product, categories = [] }: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [activeLang, setActiveLang] = useState<"en" | "ar">("en");
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          nameAr: product.nameAr ?? "",
          summary: product.summary ?? "",
          summaryAr: product.summaryAr ?? "",
          description: product.description,
          descriptionAr: product.descriptionAr ?? "",
          price: product.price,
          category: product.category,
          color: product.color,
          sku: product.sku,
          sizes: product.sizes,
          images: product.images?.length
            ? product.images
            : product.image
            ? [product.image]
            : [],
          status: product.status ?? [],
          salePrice: product.salePrice,
          skincareType: product.skincareType ?? "",
          ml: product.ml,
          pattern: product.pattern ?? "",
          productType: product.productType ?? "",
          inStock: product.inStock !== false,
        }
      : {
          name: "",
          nameAr: "",
          summary: "",
          summaryAr: "",
          description: "",
          descriptionAr: "",
          price: 0,
          category: "",
          color: "",
          sku: "",
          sizes: [],
          images: [],
          status: [],
          salePrice: undefined,
          skincareType: "",
          ml: undefined,
          pattern: "",
          productType: "",
          inStock: true,
        },
  });

  const selectedSizes = watch("sizes");
  const imagesValue = watch("images");
  const categoryValue = watch("category");
  const statusValue = watch("status") ?? [];
  const isOnSale = statusValue.includes("On Sale");
  const inStockValue = watch("inStock");
  const showSizes = categoryValue ? categoryHasSizes(categoryValue) : true;
  const showLiquidMl = categoryValue ? isLiquidCat(categoryValue) : false;
  const showSkincareType = categoryValue ? isSkincareCat(categoryValue) : false;
  const showFashionExtra = categoryValue
    ? !isLiquidCat(categoryValue) && categoryHasSizes(categoryValue)
    : false;

  function toggleStatus(item: string, checked: boolean) {
    setValue(
      "status",
      checked ? [...statusValue, item] : statusValue.filter((s) => s !== item),
      { shouldValidate: true }
    );
  }

  async function onSubmit(data: FormData) {
    setServerError("");
    const url = isEdit ? `/api/products/${product.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";
    const payload = {
      ...data,
      image: data.images[0] ?? "",
      sizes: showSizes ? data.sizes : [],
      color: data.color || "N/A",
      nameAr: data.nameAr || undefined,
      summaryAr: data.summaryAr || undefined,
      descriptionAr: data.descriptionAr || undefined,
      status: data.status,
      salePrice: data.status.includes("On Sale") ? data.salePrice : undefined,
      skincareType: showSkincareType ? data.skincareType || undefined : undefined,
      ml: showLiquidMl ? data.ml || undefined : undefined,
      pattern: showFashionExtra ? data.pattern || undefined : undefined,
      productType: showFashionExtra ? data.productType || undefined : undefined,
      inStock: data.inStock,
    };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setServerError(err.error ?? "Something went wrong");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  const categoryList =
    categories.length > 0
      ? categories.map((c) => c.name)
      : ["Outerwear", "Dresses", "Tops", "Bottoms", "Accessories", "Coats", "Knitwear", "Makeup"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">

      {/* ── Images ── */}
      <div className="space-y-2">
        <Label className="text-xs tracking-widest uppercase text-gray-500">Product Images</Label>
        <p className="text-[11px] text-gray-400">Images are shared across all languages.</p>
        <ImageUploadMultiple
          values={imagesValue}
          onChange={(urls) => setValue("images", urls, { shouldValidate: true })}
          max={10}
        />
      </div>

      {/* ── SKU ── */}
      <div className="space-y-2">
        <Label className="text-xs tracking-widest uppercase text-gray-500">SKU</Label>
        <Input {...register("sku")} placeholder="JRY-001" className="max-w-xs" />
        {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
      </div>

      {/* ── Language tabs ── */}
      <div className="space-y-0">
        <div className="flex border-b border-gray-200">
          {(["en", "ar"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px ${
                activeLang === lang
                  ? "border-jorrey-black text-jorrey-black"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {lang === "en" ? "English" : "عربي"}
            </button>
          ))}
        </div>

        {/* English fields */}
        <div className={`pt-6 space-y-6 ${activeLang === "en" ? "" : "hidden"}`}>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">Name</Label>
            <Input {...register("name")} placeholder="Silk Noir Blazer" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              Summary{" "}
              <span className="text-gray-300 normal-case tracking-normal font-normal">
                shown on card
              </span>
            </Label>
            <Input
              {...register("summary")}
              placeholder="A one-line description on the product card"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              Description{" "}
              <span className="text-gray-300 normal-case tracking-normal font-normal">
                full detail in modal
              </span>
            </Label>
            <Textarea
              {...register("description")}
              placeholder="Full product description…"
              rows={5}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Arabic fields */}
        <div
          className={`pt-6 space-y-6 ${activeLang === "ar" ? "" : "hidden"}`}
          dir="rtl"
        >
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">الاسم</Label>
            <Input {...register("nameAr")} placeholder="بليزر نوار الحريري" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              الملخص{" "}
              <span className="text-gray-300 normal-case tracking-normal font-normal">
                يظهر على البطاقة
              </span>
            </Label>
            <Input
              {...register("summaryAr")}
              placeholder="وصف قصير يظهر على بطاقة المنتج"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              الوصف{" "}
              <span className="text-gray-300 normal-case tracking-normal font-normal">
                التفاصيل الكاملة
              </span>
            </Label>
            <Textarea
              {...register("descriptionAr")}
              placeholder="الوصف الكامل للمنتج…"
              rows={5}
            />
          </div>
        </div>
      </div>

      {/* ── Price + Category + Color ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">Price</Label>
          <Input
            {...register("price", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="1850"
          />
          {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">Category</Label>
          <Select
            defaultValue={product?.category}
            onValueChange={(v) => setValue("category", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {categoryList.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-red-500">{errors.category.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">Color</Label>
          <Select
            defaultValue={product?.color ?? ""}
            onValueChange={(v) => setValue("color", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Select color…">
                {(() => {
                  const c = PRODUCT_COLORS.find((x) => x.name === watch("color"));
                  return c ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span style={{ color: isLightHex(c.hex) ? "#374151" : c.hex }}>
                        {c.name}
                      </span>
                    </span>
                  ) : (
                    watch("color") || "Select color…"
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {PRODUCT_COLORS.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span
                      style={{ color: isLightHex(c.hex) ? "#374151" : c.hex }}
                      className="font-medium"
                    >
                      {c.name}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Sizes (clothing only) ── */}
      {showSizes && (
        <div className="space-y-3">
          <Label className="text-xs tracking-widest uppercase text-gray-500">
            Available Sizes <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-wrap gap-3">
            {SIZES.map((size) => (
              <label key={size} className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={selectedSizes?.includes(size)}
                  onCheckedChange={(checked) => {
                    const current = selectedSizes ?? [];
                    setValue(
                      "sizes",
                      checked
                        ? [...current, size]
                        : current.filter((s) => s !== size),
                      { shouldValidate: true }
                    );
                  }}
                />
                <span className="text-sm text-gray-700">{size}</span>
              </label>
            ))}
          </div>
          {errors.sizes && (
            <p className="text-xs text-red-500">{errors.sizes.message as string}</p>
          )}
        </div>
      )}

      {!showSizes && !showLiquidMl && categoryValue && (
        <p className="text-xs text-gray-400 italic">
          Size options are not applicable for {categoryValue} products.
        </p>
      )}

      {/* ── Liquid: Skincare type + Bottle Size ML ── */}
      {showLiquidMl && (
        <div className="space-y-4 border border-jorrey-gold/20 bg-jorrey-beige/10 px-4 py-4">
          {showSkincareType && (
            <div className="space-y-2">
              <Label className="text-xs tracking-widest uppercase text-gray-500">
                Skincare Type <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400">
                Assigns this product to a filter category on the SkinCare page.
              </p>
              <Select
                defaultValue={product?.skincareType ?? ""}
                onValueChange={(v) =>
                  setValue("skincareType", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {SKINCARE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.skincareType && (
                <p className="text-xs text-red-500">
                  {errors.skincareType.message as string}
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              Bottle Size (ML) <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-400">
              Volume displayed on the product card (e.g. 50).
            </p>
            <Input
              {...register("ml", { valueAsNumber: true })}
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 50"
              className="max-w-xs rounded-none"
            />
            {errors.ml && (
              <p className="text-xs text-red-500">{errors.ml.message as string}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Fashion extra filters ── */}
      {showFashionExtra && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              Pattern{" "}
              <span className="text-gray-300 normal-case font-normal tracking-normal">
                (optional)
              </span>
            </Label>
            <Input
              {...register("pattern")}
              placeholder="e.g. Solid, Striped, Floral"
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widest uppercase text-gray-500">
              Product Type{" "}
              <span className="text-gray-300 normal-case font-normal tracking-normal">
                (optional)
              </span>
            </Label>
            <Input
              {...register("productType")}
              placeholder="e.g. Blazer, Cardigan, Midi"
              className="rounded-none"
            />
          </div>
        </div>
      )}

      {/* ── Stock Status ── */}
      <div className="space-y-2">
        <Label className="text-xs tracking-widest uppercase text-gray-500">Stock Status</Label>
        <div className={`border px-4 py-3 flex items-start gap-3 transition-colors ${!inStockValue ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}>
          <Checkbox
            checked={!inStockValue}
            onCheckedChange={(v) => setValue("inStock", !v, { shouldValidate: true })}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-jorrey-black">Mark as Out of Stock</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Shows a red <span className="font-semibold text-red-600">OUT OF STOCK</span> badge on the product card and disables add-to-bag.
            </p>
          </div>
        </div>
        {!inStockValue && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            <span className="text-base leading-none mt-0.5">💡</span>
            <span>
              Customers can add this product to their <strong>Watchlist</strong> and will be notified automatically when it&apos;s back in stock.
            </span>
          </div>
        )}
      </div>

      {/* ── Special Status ── */}
      <div className="space-y-2">
        <Label className="text-xs tracking-widest uppercase text-gray-500">Special Status</Label>
        <p className="text-[11px] text-gray-400">
          A product can have multiple statuses. Each status adds a badge and lists the product on
          its collection page.
        </p>

        {/* Featured */}
        <div className="border border-jorrey-gold/30 bg-jorrey-beige/20 px-4 py-3 flex items-start gap-3">
          <Checkbox
            checked={statusValue.includes("Featured")}
            onCheckedChange={(v) => toggleStatus("Featured", !!v)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-jorrey-black">Featured Product</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Shows a FEATURED badge. Listed on{" "}
              <span className="font-mono">/featured</span> and the homepage.
            </p>
          </div>
        </div>

        {/* On Sale */}
        <div className="border border-red-200 bg-red-50/40 px-4 py-3 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={statusValue.includes("On Sale")}
              onCheckedChange={(v) => toggleStatus("On Sale", !!v)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-jorrey-black">On Sale</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Shows a SALE badge and discounted price. Listed on{" "}
                <span className="font-mono">/sale</span>.
              </p>
            </div>
          </div>
          {isOnSale && (
            <div className="space-y-1.5 ms-7">
              <Label className="text-xs tracking-widest uppercase text-gray-500">
                Sale Price *
              </Label>
              <Input
                {...register("salePrice", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="e.g. 990"
                className="max-w-xs rounded-none"
              />
              {errors.salePrice && (
                <p className="text-xs text-red-500">
                  {errors.salePrice.message as string}
                </p>
              )}
            </div>
          )}
        </div>

        {/* New Arrival */}
        <div className="border border-teal-200 bg-teal-50/40 px-4 py-3 flex items-start gap-3">
          <Checkbox
            checked={statusValue.includes("New Arrival")}
            onCheckedChange={(v) => toggleStatus("New Arrival", !!v)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-jorrey-black">New Arrival</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Shows a NEW ARRIVAL badge. Listed on{" "}
              <span className="font-mono">/new-arrival</span>.
            </p>
          </div>
        </div>

        {/* Clearance */}
        <div className="border border-orange-200 bg-orange-50/40 px-4 py-3 flex items-start gap-3">
          <Checkbox
            checked={statusValue.includes("Clearance")}
            onCheckedChange={(v) => toggleStatus("Clearance", !!v)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-jorrey-black">Clearance</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Shows a CLEARANCE badge. Listed on{" "}
              <span className="font-mono">/clearance</span>.
            </p>
          </div>
        </div>

        {/* Limited Edition */}
        <div className="border border-jorrey-gold/40 bg-jorrey-beige/30 px-4 py-3 flex items-start gap-3">
          <Checkbox
            checked={statusValue.includes("Limited Edition")}
            onCheckedChange={(v) => toggleStatus("Limited Edition", !!v)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-jorrey-black">Limited Edition</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Shows a LIMITED EDITION gold badge. Listed on{" "}
              <span className="font-mono">/limited-edition</span>.
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2">{serverError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black rounded-none tracking-widest uppercase text-xs px-8 transition-colors"
        >
          {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-none text-xs tracking-widest uppercase"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
