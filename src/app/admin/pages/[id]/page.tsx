import { notFound } from "next/navigation";
import { getCustomPage } from "@/lib/pages";
import { CustomPageEditor, PageMetadataEditor } from "@/components/admin/PageEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getCustomPage(id);
  if (!page) notFound();

  return (
    <main className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-jorrey-black">{page.title}</h1>
          <p className="text-gray-400 text-sm mt-1">/{page.slug}</p>
        </div>
        <Link href="/admin/pages" className="text-xs text-jorrey-gold hover:underline tracking-wide">← All Pages</Link>
      </div>
      <PageMetadataEditor page={page} />
      <CustomPageEditor page={page} />
    </main>
  );
}
