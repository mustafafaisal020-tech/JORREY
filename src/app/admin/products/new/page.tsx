import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  const categories = await getCategories();
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">New Product</h1>
        <p className="text-gray-400 text-sm mt-1">
          Add a new product to your catalogue
        </p>
      </div>
      <ProductForm categories={categories} />
    </main>
  );
}
