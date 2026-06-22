import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCustomer, addToFavorites, ensureCustomer } from "@/lib/customers";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customer = await getCustomer(userId);
  return NextResponse.json(customer?.favorites ?? []);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { productId, productName } = body;
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

    const updated = await addToFavorites(userId, {
      productId,
      productName,
      addedAt: new Date().toISOString(),
    });
    return NextResponse.json(updated?.favorites ?? []);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
