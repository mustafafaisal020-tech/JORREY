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

    // 1. Try WhatsApp (Meta Cloud API) — works when WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set
    const waSent = await sendWhatsApp(normalised, buildOtpMessage(normalised, code, locale));
    if (waSent) {
      console.log(`[OTP] ${normalised} → ${code} (WhatsApp)`);
      return NextResponse.json({ ok: true, method: "whatsapp" });
    }

    // 2. Fall back to email — works when Resend is configured and user provided an email
    const trimmedEmail = email?.trim();
    if (trimmedEmail) {
      const emailSent = await sendOtpEmail(trimmedEmail, code, locale);
      console.log(`[OTP] ${normalised} → ${code} (email${emailSent ? "" : " — Resend may not be configured"})`);
      return NextResponse.json({ ok: true, method: "email" });
    }

    // 3. Neither delivery method available — ask for email
    console.log(`[OTP] ${normalised} → ${code} (no delivery — dev only)`);
    return NextResponse.json(
      {
        error: locale === "ar"
          ? "أضف بريدك الإلكتروني أدناه لاستلام رمز التحقق"
          : "Add your email address to receive the verification code",
        needsEmail: true,
      },
      { status: 422 }
    );
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
