/**
 * POST /api/auth/phone-register
 * Creates a new Clerk account + customer profile using a verified-phone token,
 * then returns a Clerk sign-in ticket.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { upsertCustomer, getCustomerByPhone } from "@/lib/customers";

export const dynamic = "force-dynamic";

const devStore = new Map<string, { phone: string; expiresAt: number }>();

async function consumeVerifiedToken(token: string): Promise<string | null> {
  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const phone = await redis.getdel<string>(`phone-verified:${token}`);
    return phone ?? null;
  }
  const entry = devStore.get(token);
  if (!entry) return null;
  devStore.delete(token);
  if (Date.now() > entry.expiresAt) return null;
  return entry.phone;
}

export async function POST(req: NextRequest) {
  try {
    const { verifiedToken, firstName, email } = await req.json() as {
      verifiedToken: string;
      firstName: string;
      email?: string;
    };

    if (!verifiedToken || !firstName?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const phone = await consumeVerifiedToken(verifiedToken);
    if (!phone) {
      return NextResponse.json({ error: "Token expired. Please restart verification." }, { status: 400 });
    }

    // Check if account already exists with this phone
    const existing = await getCustomerByPhone(phone);
    if (existing) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }

    // Use provided email or generate a virtual one from the phone digits
    const effectiveEmail = email?.trim() ||
      `wa${phone.replace(/\D/g, "")}@jorrey.app`;

    const clerk = await clerkClient();

    // Create Clerk account
    let user;
    try {
      user = await clerk.users.createUser({
        emailAddress: [effectiveEmail],
        firstName: firstName.trim(),
        skipPasswordChecks: true,
      });
    } catch (clerkErr: unknown) {
      // If email already exists, try to find the existing Clerk user
      const errMsg = String(clerkErr);
      if (errMsg.includes("email") || errMsg.includes("exist")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try signing in." },
          { status: 409 }
        );
      }
      throw clerkErr;
    }

    // Save customer profile with phone for future sign-in lookups
    await upsertCustomer(user.id, {
      email: effectiveEmail,
      firstName: firstName.trim(),
      phone,
      whatsappNumber: phone,
      watchlist: [],
      favorites: [],
      notifications: [],
    });

    // Create a sign-in token so the client can establish a Clerk session
    const { token } = await clerk.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 300,
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[phone-register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
