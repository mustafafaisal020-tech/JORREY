import { randomUUID } from "crypto";
import { readStore, writeStore } from "./blob-store";

export type { Product, ProductInput, ProductChangeEvent } from "./product-types";
export { CATEGORIES, SIZES, SKINCARE_TYPES } from "./product-types";
import type { Product, ProductInput, ProductChangeEvent } from "./product-types";

const KEY = "products";
const CHANGELOG_KEY = "product-changelog";
const MAX_CHANGELOG = 500;

function normalize(raw: Record<string, unknown>): Product {
  const rawImages = raw.images as string[] | undefined;
  const rawImage = raw.image as string | undefined;
  const images: string[] =
    Array.isArray(rawImages) && rawImages.length > 0
      ? rawImages
      : rawImage
      ? [rawImage]
      : [];

  // Migrate old per-boolean status fields → status array
  let status: string[] = Array.isArray(raw.status) ? [...(raw.status as string[])] : [];
  if (status.length === 0) {
    if (raw.featured) status.push("Featured");
    if (raw.onSale) status.push("On Sale");
    if (raw.newArrival) status.push("New Arrival");
    if (raw.clearance) status.push("Clearance");
    if (raw.limitedEdition) status.push("Limited Edition");
  }

  // Migrate old bottleSizeMl → ml
  const ml = (raw.ml as number | undefined) ?? (raw.bottleSizeMl as number | undefined);

  return {
    summary: "",
    inStock: true,
    ...(raw as Partial<Product>),
    images,
    image: images[0] ?? "",
    sizes: Array.isArray(raw.sizes) ? (raw.sizes as string[]) : [],
    status: status as Product["status"],
    ml,
  } as Product;
}

async function readAll(includeArchived = false): Promise<Product[]> {
  const raw = await readStore<Record<string, unknown>[]>(KEY, []);
  const all = raw.map(normalize);
  return includeArchived ? all : all.filter((p) => !p.archived);
}

async function writeAll(products: Product[]): Promise<void> {
  await writeStore(KEY, products);
}

// ── Changelog ──────────────────────────────────────────────────────────────

async function appendChangelog(entry: Omit<ProductChangeEvent, "id">): Promise<void> {
  try {
    const existing = await readStore<ProductChangeEvent[]>(CHANGELOG_KEY, []);
    const updated = [{ ...entry, id: randomUUID() }, ...existing].slice(0, MAX_CHANGELOG);
    await writeStore(CHANGELOG_KEY, updated);
  } catch {
    // changelog failure must never break the main write
  }
}

export async function getProductChangelog(productId?: string): Promise<ProductChangeEvent[]> {
  const all = await readStore<ProductChangeEvent[]>(CHANGELOG_KEY, []);
  return productId ? all.filter((e) => e.productId === productId) : all;
}

// ── Public queries ─────────────────────────────────────────────────────────

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
    .filter((p) => p.status?.includes("On Sale"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNewArrivalProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.status?.includes("New Arrival"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getClearanceProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.status?.includes("Clearance"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLimitedEditionProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.status?.includes("Limited Edition"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return (await readAll())
    .filter((p) => p.status?.includes("Featured"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getArchivedProducts(): Promise<Product[]> {
  return (await readAll(true))
    .filter((p) => p.archived)
    .sort((a, b) =>
      new Date(b.archivedAt ?? b.updatedAt).getTime() -
      new Date(a.archivedAt ?? a.updatedAt).getTime()
    );
}

export async function getProduct(id: string): Promise<Product | undefined> {
  // Include archived so admin edit still works on recently archived products
  return (await readAll(true)).find((p) => p.id === id);
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createProduct(
  data: ProductInput,
  adminId = "unknown"
): Promise<Product> {
  const all = await readAll(true);
  const images = data.images?.length ? data.images : data.image ? [data.image] : [];
  const product: Product = {
    ...data,
    images,
    image: images[0] ?? "",
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(product);
  await writeAll(all);
  await appendChangelog({
    productId: product.id,
    productName: product.name,
    action: "created",
    adminId,
    timestamp: product.createdAt,
  });
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<ProductInput>,
  adminId = "unknown"
): Promise<Product | null> {
  const all = await readAll(true);
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const before = { ...all[idx] };
  const merged = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
  if (data.images?.length) {
    merged.images = data.images;
    merged.image = data.images[0];
  } else if (data.image) {
    merged.images = [data.image];
    merged.image = data.image;
  }
  all[idx] = merged;
  await writeAll(all);

  // Build a diff of changed scalar fields for the changelog
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const trackFields: (keyof Product)[] = ["name", "price", "salePrice", "status", "inStock", "category"];
  for (const field of trackFields) {
    const b = before[field];
    const a = merged[field];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes[field] = { before: b, after: a };
    }
  }

  await appendChangelog({
    productId: id,
    productName: merged.name,
    action: "updated",
    adminId,
    timestamp: merged.updatedAt,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });

  return all[idx];
}

// Soft delete — marks product as archived, keeps it in the blob
export async function archiveProduct(
  id: string,
  adminId = "unknown"
): Promise<boolean> {
  const all = await readAll(true);
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  all[idx] = {
    ...all[idx],
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: adminId,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  await appendChangelog({
    productId: id,
    productName: all[idx].name,
    action: "archived",
    adminId,
    timestamp: all[idx].archivedAt!,
  });
  return true;
}

export async function restoreProduct(
  id: string,
  adminId = "unknown"
): Promise<Product | null> {
  const all = await readAll(true);
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    archived: false,
    archivedAt: undefined,
    archivedBy: undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all);
  await appendChangelog({
    productId: id,
    productName: all[idx].name,
    action: "restored",
    adminId,
    timestamp: all[idx].updatedAt,
  });
  return all[idx];
}

// Hard delete — kept for emergency use via direct API, prefer archiveProduct
export async function deleteProduct(id: string): Promise<boolean> {
  const all = await readAll(true);
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length === all.length) return false;
  await writeAll(filtered);
  return true;
}
