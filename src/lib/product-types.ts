export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  summary: string;
  summaryAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  category: string;
  color: string;
  sizes: string[];
  sku: string;
  image: string;
  images: string[];
  featured: boolean;
  onSale: boolean;
  salePrice?: number;
  skincareType?: string;
  bottleSizeMl?: number;
  pattern?: string;
  productType?: string;
  newArrival?: boolean;
  clearance?: boolean;
  limitedEdition?: boolean;
  inStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export const CATEGORIES = [
  "Outerwear",
  "Dresses",
  "Tops",
  "Bottoms",
  "Accessories",
  "Coats",
  "Knitwear",
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const SKINCARE_TYPES = [
  "Cleanser",
  "Exfoliant",
  "Serum",
  "Moisturizers",
  "Creams",
  "Skin Brightening",
  "SPF",
] as const;

export type SkincareType = (typeof SKINCARE_TYPES)[number];

export const NO_SIZE_CATEGORIES = ["skincare", "accessories"];

export const PRODUCT_COLORS = [
  { name: "Black",      hex: "#000000" },
  { name: "White",      hex: "#FFFFFF" },
  { name: "Ivory",      hex: "#FFFAF0" },
  { name: "Cream",      hex: "#FFF8E7" },
  { name: "Beige",      hex: "#E8DCC8" },
  { name: "Sand",       hex: "#C2B280" },
  { name: "Camel",      hex: "#C19A6B" },
  { name: "Tan",        hex: "#D2B48C" },
  { name: "Brown",      hex: "#92400E" },
  { name: "Chocolate",  hex: "#6B2C00" },
  { name: "Charcoal",   hex: "#374151" },
  { name: "Grey",       hex: "#6B7280" },
  { name: "Silver",     hex: "#9CA3AF" },
  { name: "Burgundy",   hex: "#800020" },
  { name: "Red",        hex: "#DC2626" },
  { name: "Rose",       hex: "#F43F5E" },
  { name: "Pink",       hex: "#EC4899" },
  { name: "Blush",      hex: "#FDA4AF" },
  { name: "Mauve",      hex: "#C084FC" },
  { name: "Lilac",      hex: "#A78BFA" },
  { name: "Purple",     hex: "#7C3AED" },
  { name: "Navy",       hex: "#1E3A5F" },
  { name: "Blue",       hex: "#2563EB" },
  { name: "Sky Blue",   hex: "#38BDF8" },
  { name: "Teal",       hex: "#0D9488" },
  { name: "Emerald",    hex: "#059669" },
  { name: "Green",      hex: "#16A34A" },
  { name: "Olive",      hex: "#6B7421" },
  { name: "Khaki",      hex: "#BFA882" },
  { name: "Yellow",     hex: "#EAB308" },
  { name: "Gold",       hex: "#D97706" },
  { name: "Orange",     hex: "#EA580C" },
  { name: "Coral",      hex: "#F97316" },
  { name: "Terracotta", hex: "#CD5C40" },
  { name: "Multi",      hex: "#8B5CF6" },
] as const;

export function categoryHasSizes(category: string): boolean {
  return !NO_SIZE_CATEGORIES.includes(category.toLowerCase());
}

export function isSkincareCat(category: string): boolean {
  return category.toLowerCase().replace(/\s/g, "") === "skincare";
}
