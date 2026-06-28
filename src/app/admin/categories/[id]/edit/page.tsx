import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">Edit Category</h1>
        <p className="text-gray-400 text-sm mt-1">{category.name}</p>
      </div>
      <CategoryForm category={category} />
    </main>
  );
}
