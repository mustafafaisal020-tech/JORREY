/**
 * POST /api/auth/phone-verify
 * Verifies a WhatsApp OTP and returns a short-lived verified-phone token.
 * The token is single-use and must be consumed by phone-signin or phone-register
 * within 5 minutes.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyOtp } from "@/lib/email";

export const dynamic = "force-dynamic";

// In-memory fallback for dev; Redis used in production.
const devStore = new Map<string, { phone: string; expiresAt: number }>();

async function storeVerifiedToken(token: string, phone: string): Promise<void> {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set(`phone-verified:${token}`, phone, { ex: 300 });
  } else {
    devStore.set(token, { phone, expiresAt });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json() as { phone: string; code: string };
    if (!phone || !code) {
      return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });
    }

    const normalised = phone.replace(/\s/g, "");
    const result = await verifyOtp(normalised, code);

    if (result !== "ok") {
      const msgs: Record<string, string> = {
        expired: "Code expired. Request a new one.",
        invalid: "Invalid code. Check and try again.",
        max_attempts: "Too many attempts. Request a new code.",
      };
      return NextResponse.json({ error: msgs[result] ?? "Verification failed" }, { status: 400 });
    }

    const verifiedToken = randomUUID();
    await storeVerifiedToken(verifiedToken, normalised);

    return NextResponse.json({ verifiedToken });
  } catch (err) {
    console.error("[phone-verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
