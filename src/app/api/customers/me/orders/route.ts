import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrdersByCustomer } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await getOrdersByCustomer(userId);
  return NextResponse.json(orders);
}
