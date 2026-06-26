import { randomUUID } from "crypto";
import { readStore, writeStore } from "./blob-store";

export type { HomeSection, CustomPage, CustomSection, PagesData } from "./pages-types";
import type { PagesData, CustomPage, CustomSection, HomeSection } from "./pages-types";

const KEY = "pages";
const DEFAULTS: PagesData = {
  home: {
    sections: [
      { id: "hero", name: "Hero", nameAr: "البطل", visible: true, order: 0 },
      { id: "collections", name: "Collections", nameAr: "المجموعات", visible: true, order: 1 },
      { id: "testimonials", name: "Testimonials", nameAr: "آراء العملاء", visible: true, order: 2 },
      { id: "cta", name: "Call to Action", nameAr: "دعوة للعمل", visible: true, order: 3 },
      { id: "email", name: "Email Signup", nameAr: "الاشتراك بالبريد", visible: true, order: 4 },
    ],
  },
  custom: [],
};

async function read(): Promise<PagesData> {
  const stored = await readStore<Partial<PagesData>>(KEY, {});
  return { ...DEFAULTS, ...stored };
}

async function write(data: PagesData): Promise<void> {
  return writeStore(KEY, data);
}

export async function getPagesData(): Promise<PagesData> {
  return read();
}

export async function getHomeSections(): Promise<HomeSection[]> {
  return (await read()).home.sections.sort((a, b) => a.order - b.order);
}

export async function updateHomeSection(id: string, patch: Partial<HomeSection>): Promise<boolean> {
  const data = await read();
  const idx = data.home.sections.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  data.home.sections[idx] = { ...data.home.sections[idx], ...patch };
  await write(data);
  return true;
}

export async function reorderHomeSections(ids: string[]): Promise<void> {
  const data = await read();
  ids.forEach((id, i) => {
    const s = data.home.sections.find((x) => x.id === id);
    if (s) s.order = i;
  });
  await write(data);
}

export async function getCustomPages(includeHidden = false): Promise<CustomPage[]> {
  const pages = (await read()).custom;
  const filtered = includeHidden ? pages : pages.filter((p) => p.visible);
  return filtered.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}

export async function reorderCustomPages(ids: string[]): Promise<void> {
  const data = await read();
  ids.forEach((id, i) => {
    const p = data.custom.find((x) => x.id === id);
    if (p) p.order = i;
  });
  await write(data);
}

export async function getRootPages(includeHidden = false): Promise<CustomPage[]> {
  return (await getCustomPages(includeHidden)).filter((p) => !p.parentId);
}

export async function getChildPages(parentId: string, includeHidden = false): Promise<CustomPage[]> {
  return (await getCustomPages(includeHidden)).filter((p) => p.parentId === parentId);
}

export async function getCustomPage(id: string): Promise<CustomPage | undefined> {
  return (await read()).custom.find((p) => p.id === id);
}

export async function createCustomPage(
  input: Omit<CustomPage, "id" | "sections" | "createdAt" | "updatedAt">
): Promise<CustomPage> {
  const data = await read();
  const page: CustomPage = {
    ...input,
    id: randomUUID(),
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.custom.push(page);
  await write(data);
  return page;
}

export async function updateCustomPage(
  id: string,
  patch: Partial<Omit<CustomPage, "id" | "createdAt" | "sections">>
): Promise<CustomPage | null> {
  const data = await read();
  const idx = data.custom.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  data.custom[idx] = { ...data.custom[idx], ...patch, updatedAt: new Date().toISOString() };
  await write(data);
  return data.custom[idx];
}

export async function deleteCustomPage(id: string): Promise<boolean> {
  const data = await read();
  const next = data.custom.filter((p) => p.id !== id && p.parentId !== id);
  if (next.length === data.custom.length) return false;
  data.custom = next;
  await write(data);
  return true;
}

export async function addSection(
  pageId: string,
  input: Omit<CustomSection, "id">
): Promise<CustomSection | null> {
  const data = await read();
  const page = data.custom.find((p) => p.id === pageId);
  if (!page) return null;
  const section: CustomSection = { ...input, id: randomUUID() };
  page.sections.push(section);
  page.updatedAt = new Date().toISOString();
  await write(data);
  return section;
}

export async function updateSection(
  pageId: string,
  sectionId: string,
  patch: Partial<Omit<CustomSection, "id">>
): Promise<boolean> {
  const data = await read();
  const page = data.custom.find((p) => p.id === pageId);
  if (!page) return false;
  const idx = page.sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return false;
  page.sections[idx] = { ...page.sections[idx], ...patch };
  page.updatedAt = new Date().toISOString();
  await write(data);
  return true;
}

export async function getLegalPages(includeHidden = false): Promise<CustomPage[]> {
  const pages = (await read()).custom.filter((p) => p.pageGroup === "legal");
  const filtered = includeHidden ? pages : pages.filter((p) => p.visible);
  return filtered.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}

export async function seedLegalPages(): Promise<void> {
  const data = await read();
  const existingSlugs = new Set(data.custom.filter((p) => p.pageGroup === "legal").map((p) => p.slug));
  const defaults = [
    { slug: "privacy-policy",   title: "Privacy Policy",      titleAr: "سياسة الخصوصية" },
    { slug: "terms-of-service", title: "Terms of Service",    titleAr: "شروط الخدمة" },
    { slug: "shipping-return",  title: "Shipping & Returns",  titleAr: "الشحن والإرجاع" },
  ];
  let changed = false;
  defaults.forEach((def, i) => {
    if (!existingSlugs.has(def.slug)) {
      data.custom.push({
        ...def,
        id: randomUUID(),
        pageGroup: "legal",
        sections: [],
        visible: true,
        order: 9000 + i,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      changed = true;
    }
  });
  if (changed) await write(data);
}

export async function deleteSection(pageId: string, sectionId: string): Promise<boolean> {
  const data = await read();
  const page = data.custom.find((p) => p.id === pageId);
  if (!page) return false;
  const before = page.sections.length;
  page.sections = page.sections.filter((s) => s.id !== sectionId);
  if (page.sections.length === before) return false;
  page.updatedAt = new Date().toISOString();
  await write(data);
  return true;
}
