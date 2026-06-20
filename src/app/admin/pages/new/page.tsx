import NewPageForm from "@/components/admin/NewPageForm";
import { getRootPages, getHomeSections } from "@/lib/pages";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewPagePage({ searchParams }: Props) {
  const { parentId } = await searchParams;
  const [parentPages, homeSections] = await Promise.all([getRootPages(true), getHomeSections()]);

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">New Page</h1>
        <p className="text-gray-400 text-sm mt-1">Create a new custom page</p>
      </div>
      <NewPageForm parentPages={parentPages} defaultParentId={parentId} homeSections={homeSections} />
    </main>
  );
}
