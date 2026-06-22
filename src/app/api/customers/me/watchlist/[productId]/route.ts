import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { removeFromWatchlist, addToWatchlist, getCustomer } from "@/lib/customers";
import type { NotificationChannel } from "@/lib/customer-types";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await params;
  const updated = await removeFromWatchlist(userId, productId);
  return NextResponse.json(updated?.watchlist ?? []);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { productId } = await params;

  try {
    const { notifyPriceDrop, notifyRestock, notificationChannel } = await req.json();
    const customer = await getCustomer(userId);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = customer.watchlist.find((w) => w.productId === productId);
    if (!existing) return NextResponse.json({ error: "Not in watchlist" }, { status: 404 });

    const updated = await addToWatchlist(userId, {
      ...existing,
      notifyPriceDrop: notifyPriceDrop ?? existing.notifyPriceDrop,
      notifyRestock: notifyRestock ?? existing.notifyRestock,
      notificationChannel: (notificationChannel ?? existing.notificationChannel ?? "email") as NotificationChannel,
    });
    return NextResponse.json(updated?.watchlist ?? []);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
