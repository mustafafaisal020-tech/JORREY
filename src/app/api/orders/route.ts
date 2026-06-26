import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrders, createOrder } from "@/lib/orders";
import { sendOrderConfirmation } from "@/lib/email";
import type { Order } from "@/lib/order-types";

export const dynamic = "force-dynamic";

/** GET /api/orders — admin: list all orders */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await getOrders();
  return NextResponse.json(orders);
}

/** POST /api/orders — create order (called from checkout) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = await auth();

    const orderData: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
      customerId: userId ?? null,
      customerEmail: body.customerEmail ?? undefined,
      customerPhone: body.customerPhone ?? undefined,
      customerWhatsapp: body.customerWhatsapp ?? undefined,
      items: body.items,
      address: body.address,
      subtotal: body.subtotal,
      shipping: body.shipping ?? 0,
      discount: body.discount ?? 0,
      total: body.total,
      currencySymbol: body.currencySymbol ?? "$",
      status: "processing",
      locale: body.locale ?? "en",
    };

    const order = await createOrder(orderData);

    // Fire-and-forget confirmation messages
    sendOrderConfirmation(order).catch(() => {});

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
