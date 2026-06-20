import { getHomeSections } from "@/lib/pages";
import { getSettings } from "@/lib/settings";
import { getFeaturedProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedCollections from "@/components/FeaturedCollections";
import Testimonials from "@/components/Testimonials";
import EmailSignup from "@/components/EmailSignup";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sections, settings, featuredProducts, categories] = await Promise.all([
    getHomeSections(),
    getSettings(),
    getFeaturedProducts(),
    getCategories(false),
  ]);

  const visible = (id: string) => sections.find((s) => s.id === id)?.visible ?? true;

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
        categories={categories}
      />
      <main>
        {visible("hero") && <Hero section={sections.find((s) => s.id === "hero")} />}
        {visible("collections") && (
          <FeaturedCollections
            whatsappNumber={settings.whatsappNumber}
            currencySymbol={settings.currencySymbol}
            products={featuredProducts}
            categories={categories}
            collectionsTitle={settings.collectionsTitle}
            collectionsTitleAr={settings.collectionsTitleAr}
            collectionsDescription={settings.collectionsDescription}
            collectionsDescriptionAr={settings.collectionsDescriptionAr}
          />
        )}
        {visible("testimonials") && <Testimonials />}
        {visible("cta") && <CTA />}
        {visible("email") && <EmailSignup />}
      </main>
      <Footer />
      <CartDrawer
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
      />
    </CartProvider>
  );
}
