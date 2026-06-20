import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCustomer, upsertCustomer } from "@/lib/customers";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getCustomer(userId);
  return NextResponse.json(profile ?? null);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const profile = await upsertCustomer(userId, body);
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
