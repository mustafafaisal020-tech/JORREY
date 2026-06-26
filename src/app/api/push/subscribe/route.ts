import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { savePushSubscription, removePushSubscription } from "@/lib/push";
import type webpush from "web-push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription, locale } = (await req.json()) as {
    subscription: webpush.PushSubscription;
    locale: string;
  };

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await savePushSubscription({ userId, locale, subscription });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await removePushSubscription(userId);
  return NextResponse.json({ success: true });
}
