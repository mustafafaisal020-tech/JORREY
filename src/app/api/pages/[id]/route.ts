import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCustomPage, updateCustomPage, deleteCustomPage, addSection, updateSection, deleteSection } from "@/lib/pages";
import { requireAdmin } from "@/lib/roles";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getCustomPage(id);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json();
    if (body._action === "addSection") {
      const sec = await addSection(id, body.section);
      return sec ? NextResponse.json(sec) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (body._action === "updateSection") {
      const ok = await updateSection(id, body.sectionId, body.patch);
      return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (body._action === "deleteSection") {
      const ok = await deleteSection(id, body.sectionId);
      return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const page = await updateCustomPage(id, body);
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const ok = await deleteCustomPage(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
