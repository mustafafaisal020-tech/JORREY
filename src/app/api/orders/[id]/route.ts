import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrder, updateOrderStatus } from "@/lib/orders";
import { sendStatusUpdateNotification } from "@/lib/email";
import { sendOrderPush } from "@/lib/push";
import type { OrderStatus } from "@/lib/order-types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Only owner or admin can view — for simplicity we check ownership
  if (order.customerId && order.customerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json() as { status: OrderStatus };
  const order = await updateOrderStatus(id, status);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Fire-and-forget status notifications (WhatsApp + push)
  sendStatusUpdateNotification(order, status).catch(() => {});
  if (order.customerId) {
    sendOrderPush(order.customerId, status, id).catch(() => {});
  }
  return NextResponse.json(order);
}
