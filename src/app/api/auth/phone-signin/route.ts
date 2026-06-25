/**
 * POST /api/auth/phone-signin
 * Signs in an existing customer using a verified-phone token.
 * Returns a Clerk sign-in ticket the client uses to establish a session.
 */
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getCustomerByPhone } from "@/lib/customers";

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
    const { verifiedToken } = await req.json() as { verifiedToken: string };
    if (!verifiedToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const phone = await consumeVerifiedToken(verifiedToken);
    if (!phone) {
      return NextResponse.json({ error: "Token expired or invalid" }, { status: 400 });
    }

    const customer = await getCustomerByPhone(phone);
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const clerk = await clerkClient();
    const { token } = await clerk.signInTokens.createSignInToken({
      userId: customer.id,
      expiresInSeconds: 300,
    });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[phone-signin]", err);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
