/**
 * POST /api/auth/init-profile
 * Called client-side immediately after Clerk email signUp completes (setActive).
 * Creates the customer profile in the Blob store so phone-based lookups work
 * for future sign-ins.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { upsertCustomer } from "@/lib/customers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, firstName, email } = await req.json() as {
      phone: string;
      firstName: string;
      email?: string;
    };

    if (!firstName?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resolvedPhone = phone?.trim() ?? "";
    await upsertCustomer(userId, {
      email: email?.trim() ?? "",
      firstName: firstName.trim(),
      phone: resolvedPhone,
      whatsappNumber: resolvedPhone,
      watchlist: [],
      favorites: [],
      notifications: [],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[init-profile]", err);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
