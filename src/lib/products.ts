import { randomUUID } from "crypto";
import { readStore, writeStore } from "./blob-store";

export type { Product, ProductInput } from "./product-types";
export { CATEGORIES, SIZES, SKINCARE_TYPES } from "./product-types";
import type { Product, ProductInput } from "./product-types";

const KEY = "products";

function normalize(raw: Record<string, unknown>): Product {
  const rawImages = raw.images as string[] | undefined;
  const rawImage = raw.image as string | undefined;
  const images: string[] =
    Array.isArray(rawImages) && rawImages.length > 0
      ? rawImages
      : rawImage
      ? [rawImage]
      : [];
  return {
    summary: "",
    featured: false,
    onSale: false,
    inStock: true,
    ...(raw as Partial<Product>),
    images,
    image: images[0] ?? "",
    sizes: Array.isArray(raw.sizes) ? (raw.sizes as string[]) : [],
  } as Product;
}

async function readAll(): Promise<Product[]> {
  const raw = await readStore<Record<string, unknown>[]>(KEY, []);
  return raw.map(normalize);
}

async function writeAll(products: Product[]): Promise<void> {
  await writeStore(KEY, products);
}

export async function getProducts(search?: string, category?: string): Promise<Product[]> {
  let products = await readAll();
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }
  return products.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getSaleProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.onSale && p.salePrice != null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNewArrivalProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.newArrival)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getClearanceProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.clearance)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLimitedEditionProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.limitedEdition)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.featured)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await readAll()).find((p) => p.id === id);
}

export async function createProduct(data: ProductInput): Promise<Product> {
  const products = await readAll();
  const images = data.images?.length ? data.images : data.image ? [data.image] : [];
  const product: Product = {
    ...data,
    images,
    image: images[0] ?? "",
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products.push(product);
  await writeAll(products);
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<ProductInput>
): Promise<Product | null> {
  const products = await readAll();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const merged = { ...products[idx], ...data, updatedAt: new Date().toISOString() };
  if (data.images?.length) {
    merged.images = data.images;
    merged.image = data.images[0];
  } else if (data.image) {
    merged.images = [data.image];
    merged.image = data.image;
  }
  products[idx] = merged;
  await writeAll(products);
  return products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readAll();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) return false;
  await writeAll(filtered);
  return true;
}
