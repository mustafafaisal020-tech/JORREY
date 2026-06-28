import { redirect } from "next/navigation";
import { getProducts } from "@/lib/products";
import ProductTable from "@/components/admin/ProductTable";
import { getUserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");

  const products = await getProducts();

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">Products</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your product catalogue
        </p>
      </div>
      <ProductTable products={products} />
    </main>
  );
}
