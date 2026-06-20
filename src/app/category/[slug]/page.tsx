import { notFound } from "next/navigation";
import { getCategories } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { CartProvider } from "@/components/CartProvider";
import CartDrawer from "@/components/CartDrawer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryClient from "@/components/CategoryClient";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [categories, allProducts, settings] = await Promise.all([
    getCategories(false),
    getProducts(),
    getSettings(),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = allProducts.filter(
    (p) => p.category.toLowerCase() === category.name.toLowerCase()
  );

  return (
    <CartProvider>
      <Navbar
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
        categories={categories}
      />
      <CategoryClient
        category={category}
        products={products}
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
      />
      <Footer />
      <CartDrawer
        whatsappNumber={settings.whatsappNumber}
        currencySymbol={settings.currencySymbol}
      />
    </CartProvider>
  );
}
