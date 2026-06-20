import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCustomPages, getChildPages } from "@/lib/pages";
import { getSettings } from "@/lib/settings";
import { getCategories } from "@/lib/categories";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { CustomSection } from "@/lib/pages-types";

export const dynamic = "force-dynamic";

function SectionBlock({ section, isRTL }: { section: CustomSection; isRTL: boolean }) {
  if (!section.visible) return null;

  const displayName = isRTL && section.nameAr ? section.nameAr : section.name;
  const displayContent = isRTL && section.contentAr ? section.contentAr : section.content;

  if (section.type === "heading") {
    return (
      <div className="mb-10" dir={isRTL ? "rtl" : "ltr"}>
        <h2 className="font-serif text-3xl text-jorrey-black">{displayName}</h2>
      </div>
    );
  }

  return (
    <div className="mb-10" dir={isRTL ? "rtl" : "ltr"}>
      {displayName && (
        <h3 className="text-[11px] tracking-widests uppercase text-jorrey-gold mb-3">
          {displayName}
        </h3>
      )}
      {displayContent && (
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
          {displayContent}
        </p>
      )}
    </div>
  );
}

export default async function CustomPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const [pages, settings, categories] = await Promise.all([
    getCustomPages(false),
    getSettings(),
    getCategories(false),
  ]);
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();

  const childPages = await getChildPages(page.id, false);

  const sorted = [...page.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  const displayTitle = isRTL && page.titleAr ? page.titleAr : page.title;

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
        categories={categories}
      />
      <main className="min-h-screen bg-jorrey-white pt-28 pb-24" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="mb-16">
            <h1 className="font-serif text-5xl text-jorrey-black leading-tight">
              {displayTitle}
            </h1>
            <div className="w-12 h-px bg-jorrey-gold mt-6" />
          </div>

          {sorted.length === 0 ? (
            <p className="text-gray-400 text-sm">This page has no content yet.</p>
          ) : (
            sorted.map((section) => (
              <SectionBlock key={section.id} section={section} isRTL={isRTL} />
            ))
          )}

          {/* Child pages */}
          {childPages.length > 0 && (
            <div className="mt-20 pt-10 border-t border-jorrey-beige">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-6">
                {isRTL ? "أيضاً في هذا القسم" : "Also in this section"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {childPages.map((child) => {
                  const childTitle = isRTL && child.titleAr ? child.titleAr : child.title;
                  return (
                    <Link
                      key={child.id}
                      href={`/${child.slug}`}
                      className="group flex items-center justify-between border border-gray-100 px-5 py-4 hover:border-jorrey-gold transition-colors"
                    >
                      <span className="font-serif text-lg text-jorrey-black group-hover:text-jorrey-gold transition-colors">
                        {childTitle}
                      </span>
                      <span className="text-jorrey-gold text-sm">
                        {isRTL ? "←" : "→"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
      />
    </CartProvider>
  );
}
