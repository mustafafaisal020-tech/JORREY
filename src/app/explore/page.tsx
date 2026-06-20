import { Suspense } from "react";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExploreClient from "@/components/ExploreClient";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [categories, products, settings] = await Promise.all([
    getCategories(false),
    getProducts(),
    getSettings(),
  ]);

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
        categories={categories}
      />
      <Suspense fallback={null}>
        <ExploreClient
          categories={categories}
          products={products}
          whatsappNumber={settings.whatsappNumber}
          currencySymbol={settings.currencySymbol}
        />
      </Suspense>
      <Footer />
      <CartDrawer
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
      />
    </CartProvider>
  );
}
