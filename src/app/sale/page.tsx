import { getLocale, getTranslations } from "next-intl/server";
import { getCategories } from "@/lib/categories";
import { getSaleProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SalePage() {
  const locale = await getLocale();
  const isRTL = locale === "ar";
  const t = await getTranslations("sale");

  const [categories, products, settings] = await Promise.all([
    getCategories(false),
    getSaleProducts(),
    getSettings(),
  ]);

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
        categories={categories}
      />
      <main className="min-h-screen bg-jorrey-white pt-28 pb-24" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Header */}
          <div className="mb-16">
            <p className="text-red-600 text-xs tracking-[0.35em] uppercase mb-4">
              {t("eyebrow")}
            </p>
            <h1 className="font-serif text-5xl md:text-6xl text-jorrey-black leading-tight">
              {t("title")}
            </h1>
            <div className="w-12 h-px bg-red-600 mt-6" />
          </div>

          {/* Products grid */}
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  whatsappNumber={settings.whatsappNumber}
                  currencySymbol={settings.currencySymbol}
                />
              ))}
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
