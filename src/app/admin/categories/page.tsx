import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import { getCategories } from "@/lib/categories";
import CategoryTable from "@/components/admin/CategoryTable";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  const categories = await getCategories(true);
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">Categories</h1>
        <p className="text-gray-400 text-sm mt-1">Manage product categories</p>
      </div>
      <CategoryTable categories={categories} />
    </main>
  );
}
