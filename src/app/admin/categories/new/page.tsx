import CategoryForm from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">New Category</h1>
        <p className="text-gray-400 text-sm mt-1">Add a new product category</p>
      </div>
      <CategoryForm />
    </main>
  );
}
