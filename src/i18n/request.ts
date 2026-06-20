import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const VALID_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof VALID_LOCALES)[number];

export function isValidLocale(v: string): v is Locale {
  return VALID_LOCALES.includes(v as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value ?? "en";
  const locale: Locale = isValidLocale(raw) ? raw : "en";

  const messages =
    locale === "ar"
      ? (await import("../../locales/ar.json")).default
      : (await import("../../locales/en.json")).default;

  return { locale, messages };
});
