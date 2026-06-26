import { NextRequest, NextResponse } from "next/server";
import { generateOtp, storeOtp, sendWhatsApp, buildOtpMessage, sendOtpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function normaliseToE164(raw: string): string {
  let s = raw.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!s.startsWith("+")) s = "+" + s;
  // Iraqi local mobile: 07XX → +9647XX
  if (/^\+0[7-9]\d{8,9}$/.test(s)) s = "+964" + s.slice(2);
  return s;
}

function isValidE164(s: string): boolean {
  return /^\+\d{7,15}$/.test(s);
}

export async function POST(req: NextRequest) {
  try {
    const { phone, email, locale = "en" } = await req.json() as {
      phone: string;
      email?: string;
      locale?: string;
    };

    if (!phone || phone.trim().length < 5) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const normalised = normaliseToE164(phone.trim());

    if (!isValidE164(normalised)) {
      return NextResponse.json(
        { error: "Invalid phone number. Include country code, e.g. +964 7XX XXX XXXX" },
        { status: 400 }
      );
    }

    const code = generateOtp();
    await storeOtp(normalised, code);

    const trimmedEmail = email?.trim() || "";

    // Fire both channels in parallel — one code, delivered to both if available
    const [waSent, emailSent] = await Promise.all([
      sendWhatsApp(normalised, buildOtpMessage(normalised, code, locale)),
      trimmedEmail ? sendOtpEmail(trimmedEmail, code, locale) : Promise.resolve(false),
    ]);

    if (waSent && emailSent) {
      console.log(`[OTP] ${normalised} → ${code} (WhatsApp + email)`);
      return NextResponse.json({ ok: true, method: "both" });
    }
    if (waSent) {
      console.log(`[OTP] ${normalised} → ${code} (WhatsApp)`);
      return NextResponse.json({ ok: true, method: "whatsapp" });
    }
    if (emailSent) {
      console.log(`[OTP] ${normalised} → ${code} (email)`);
      return NextResponse.json({ ok: true, method: "email" });
    }

    // Neither channel delivered — prompt for email if not provided
    if (!trimmedEmail) {
      console.log(`[OTP] ${normalised} → ${code} (no delivery — needsEmail)`);
      return NextResponse.json(
        {
          error: locale === "ar"
            ? "أضف بريدك الإلكتروني أدناه لاستلام رمز التحقق"
            : "Add your email address to receive the verification code",
          needsEmail: true,
        },
        { status: 422 }
      );
    }

    // Both failed (APIs may be temporarily down) — code is stored, let customer proceed
    console.warn(`[OTP] ${normalised} → ${code} (both channels failed — delivery uncertain)`);
    return NextResponse.json({ ok: true, method: "email" });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
