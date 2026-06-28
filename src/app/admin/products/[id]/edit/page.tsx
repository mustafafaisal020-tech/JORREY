import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories(true)]);
  if (!product) notFound();

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">Edit Product</h1>
        <p className="text-gray-400 text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm product={product} categories={categories} />
    </main>
  );
}
