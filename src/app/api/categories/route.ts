import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory, reorderCategories } from "@/lib/categories";
import { requireAdmin } from "@/lib/roles";

export async function GET() {
  const categories = await getCategories(true);
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (body._action === "reorder") {
      await reorderCategories(body.ids as string[]);
      return NextResponse.json({ success: true });
    }
    const cat = await createCategory(body);
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
