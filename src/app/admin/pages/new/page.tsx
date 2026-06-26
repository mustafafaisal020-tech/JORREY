import NewPageForm from "@/components/admin/NewPageForm";
import { getRootPages, getHomeSections } from "@/lib/pages";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ parentId?: string; group?: string }>;
}

export default async function NewPagePage({ searchParams }: Props) {
  const { parentId, group } = await searchParams;
  const [parentPages, homeSections] = await Promise.all([getRootPages(true), getHomeSections()]);
  const isLegal = group === "legal";

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">
          {isLegal ? "New Legal Page" : "New Page"}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isLegal
            ? "Creates a page shown in the footer copyright bar (Privacy Policy, Terms of Service, etc.)"
            : "Create a new custom page"}
        </p>
      </div>
      <NewPageForm
        parentPages={isLegal ? [] : parentPages}
        defaultParentId={isLegal ? undefined : parentId}
        homeSections={isLegal ? [] : homeSections}
        defaultGroup={isLegal ? "legal" : undefined}
      />
    </main>
  );
}
