import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json() as { phone: string; code: string };

    if (!phone || !code) {
      return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });
    }

    const normalised = phone.replace(/\s/g, "");
    const result = await verifyOtp(normalised, code);

    if (result === "ok") {
      return NextResponse.json({ ok: true });
    }

    const messages: Record<string, string> = {
      expired: "Code has expired. Please request a new one.",
      invalid: "Invalid code. Please check and try again.",
      max_attempts: "Too many attempts. Please request a new code.",
    };

    return NextResponse.json({ error: messages[result] ?? "Verification failed" }, { status: 400 });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
