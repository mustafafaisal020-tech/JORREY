import Link from "next/link";
import { getHomeSections, getCustomPages } from "@/lib/pages";
import { HomeSectionManager, CustomPagesManager } from "@/components/admin/PageEditor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const [homeSections, allPages] = await Promise.all([getHomeSections(), getCustomPages(true)]);

  return (
    <main className="p-8 space-y-12">
      {/* Home page sections */}
      <div>
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-jorrey-black">Pages</h1>
          <p className="text-gray-400 text-sm mt-1">Manage homepage sections and custom pages</p>
        </div>
        <h2 className="text-[11px] tracking-widests uppercase text-gray-400 font-medium mb-4">Homepage Sections</h2>
        <HomeSectionManager sections={homeSections} />
      </div>

      {/* Custom pages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] tracking-widests uppercase text-gray-400 font-medium">Custom Pages</h2>
            <p className="text-xs text-gray-400 mt-1">Visible pages appear in the footer under "Company." Use arrows to reorder.</p>
          </div>
          <Link href="/admin/pages/new">
            <Button className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase">
              <Plus size={13} className="me-1" /> New Page
            </Button>
          </Link>
        </div>
        <CustomPagesManager pages={allPages} />
      </div>
    </main>
  );
}
