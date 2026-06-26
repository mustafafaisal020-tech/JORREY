/**
 * POST /api/auth/phone-register
 * Creates a new Clerk account + customer profile for phone-only users
 * (i.e. customers who did not provide an email at registration).
 * Customers who provided an email use Clerk's client-side signUp flow instead;
 * their profile is initialised by /api/auth/init-profile after email verification.
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
    const { verifiedToken, firstName } = await req.json() as {
      verifiedToken: string;
      firstName: string;
    };

    if (!verifiedToken || !firstName?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const phone = await consumeVerifiedToken(verifiedToken);
    if (!phone) {
      return NextResponse.json({ error: "Token expired. Please restart verification." }, { status: 400 });
    }

    const existing = await getCustomerByPhone(phone);
    if (existing) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }

    const clerk = await clerkClient();

    // Phone-only accounts use the phone number as the Clerk identifier.
    // Requires "Phone number" to be enabled in the Clerk dashboard under
    // User & Authentication → Email, Phone, Username.
    let user;
    try {
      user = await clerk.users.createUser({
        phoneNumber: [phone],
        firstName: firstName.trim(),
        skipPasswordChecks: true,
      });
    } catch (clerkErr: unknown) {
      const errMsg = String(clerkErr);
      if (errMsg.includes("phone") && errMsg.includes("exist")) {
        return NextResponse.json(
          { error: "An account with this phone number already exists. Try signing in." },
          { status: 409 }
        );
      }
      throw clerkErr;
    }

    await upsertCustomer(user.id, {
      email: "",
      firstName: firstName.trim(),
      phone,
      whatsappNumber: phone,
      watchlist: [],
      favorites: [],
      notifications: [],
    });

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
