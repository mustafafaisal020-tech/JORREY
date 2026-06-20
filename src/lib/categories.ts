import { randomUUID } from "crypto";
import { readStore, writeStore } from "./blob-store";

export type { Category, CategoryInput } from "./category-types";
import type { Category, CategoryInput } from "./category-types";

const KEY = "categories";

async function read(): Promise<Category[]> {
  return readStore<Category[]>(KEY, []);
}

async function write(data: Category[]): Promise<void> {
  return writeStore(KEY, data);
}

export async function getCategories(includeHidden = false): Promise<Category[]> {
  const cats = await read();
  const filtered = includeHidden ? cats : cats.filter((c) => c.visible);
  return filtered.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}

export async function reorderCategories(ids: string[]): Promise<void> {
  const all = await read();
  ids.forEach((id, i) => {
    const idx = all.findIndex((c) => c.id === id);
    if (idx !== -1) all[idx] = { ...all[idx], order: i };
  });
  await write(all);
}

export async function getCategory(id: string): Promise<Category | undefined> {
  return (await read()).find((c) => c.id === id);
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const all = await read();
  const cat: Category = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await write([...all, cat]);
  return cat;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<Category | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...input, updatedAt: new Date().toISOString() };
  await write(all);
  return all[idx];
}

export async function deleteCategory(id: string): Promise<boolean> {
  const all = await read();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  await write(next);
  return true;
}
