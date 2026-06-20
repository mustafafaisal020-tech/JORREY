import { readStore, writeStore } from "./blob-store";

export type { SiteSettings } from "./settings-types";
import type { SiteSettings } from "./settings-types";

const KEY = "settings";
const DEFAULTS: SiteSettings = {
  whatsappNumber: "",
  currency: "USD",
  currencySymbol: "$",
  siteName: "Jorrey",
  socialLinks: [],
};

export async function getSettings(): Promise<SiteSettings> {
  const stored = await readStore<Partial<SiteSettings>>(KEY, {});
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const next = { ...current, ...data };
  await writeStore(KEY, next);
  return next;
}
