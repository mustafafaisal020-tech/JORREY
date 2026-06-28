import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/roles";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const settings = await saveSettings(body);
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
