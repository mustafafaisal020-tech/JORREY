import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProductChangelog } from "@/lib/products";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const log = await getProductChangelog();
  return NextResponse.json(log);
}
