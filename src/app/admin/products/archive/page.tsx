import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import { getArchivedProducts } from "@/lib/products";
import ArchiveTable from "@/components/admin/ArchiveTable";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  const products = await getArchivedProducts();
  return (
    <main className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <a href="/admin/products" className="text-xs text-gray-400 hover:text-jorrey-black transition-colors">
            ← Products
          </a>
        </div>
        <h1 className="font-serif text-2xl text-jorrey-black">Archived Products</h1>
        <p className="text-gray-400 text-sm mt-1">
          Products removed from the store. Restore any item to make it visible again.
        </p>
      </div>
      <ArchiveTable products={products} />
    </main>
  );
}
