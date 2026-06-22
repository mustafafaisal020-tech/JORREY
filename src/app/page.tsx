import { getCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryOrbit3D from "@/components/CategoryOrbit3D";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(false),
  ]);

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
        categories={categories}
      />
      <main>
        <CategoryOrbit3D categories={categories} />
      </main>
      <Footer />
      <CartDrawer
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
      />
    </CartProvider>
  );
}
