import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPagesData, updateHomeSection, reorderHomeSections, createCustomPage, reorderCustomPages } from "@/lib/pages";
import { requireAdmin } from "@/lib/roles";

export async function GET() {
  return NextResponse.json(await getPagesData());
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (body._action === "reorderHome") {
      await reorderHomeSections(body.ids);
      return NextResponse.json({ success: true });
    }
    if (body._action === "reorderCustom") {
      await reorderCustomPages(body.ids);
      return NextResponse.json({ success: true });
    }
    if (body._action === "updateHomeSection") {
      const ok = await updateHomeSection(body.id, body.patch);
      return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const page = await createCustomPage(body);
    return NextResponse.json(page, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
