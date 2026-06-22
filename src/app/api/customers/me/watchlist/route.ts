import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCustomer, addToWatchlist, ensureCustomer } from "@/lib/customers";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await getCustomer(userId);
  return NextResponse.json(customer?.watchlist ?? []);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { productId, productName, priceAtAdd, notifyPriceDrop = true, notifyRestock = true } = body;
    if (!productId || !productName) {
      return NextResponse.json({ error: "productId and productName required" }, { status: 400 });
    }

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    await ensureCustomer(
      userId,
      clerkUser.primaryEmailAddress?.emailAddress ?? "",
      clerkUser.firstName ?? ""
    );

    const updated = await addToWatchlist(userId, {
      productId,
      productName,
      addedAt: new Date().toISOString(),
      priceAtAdd: priceAtAdd ?? 0,
      notifyPriceDrop,
      notifyRestock,
    });
    return NextResponse.json(updated?.watchlist ?? []);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
