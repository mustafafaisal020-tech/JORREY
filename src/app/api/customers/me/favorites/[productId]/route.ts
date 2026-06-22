import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { removeFromFavorites } from "@/lib/customers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await params;
  const updated = await removeFromFavorites(userId, productId);
  return NextResponse.json(updated?.favorites ?? []);
}
