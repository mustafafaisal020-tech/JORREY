import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { restoreProduct } from "@/lib/products";
import { requireAdmin } from "@/lib/roles";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const product = await restoreProduct(id, userId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
