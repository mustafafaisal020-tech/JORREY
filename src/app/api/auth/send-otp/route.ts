import { NextRequest, NextResponse } from "next/server";
import { generateOtp, storeOtp, sendWhatsApp, buildOtpMessage } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Normalise any phone input to E.164 format (+XXXXXXXXXXX).
 * Handles:
 *   00964... → +964...    (00 prefix → +)
 *   +964...  → +964...    (already correct)
 *   964...   → +964...    (bare country code, no prefix)
 *   07...    → +9647...   (Iraqi local mobile — strips leading 0, prepends +964)
 */
function normaliseToE164(raw: string): string {
  // Strip whitespace, dashes, dots, parentheses
  let s = raw.replace(/[\s\-().]/g, "");

  // 00XXXXX → +XXXXX
  if (s.startsWith("00")) s = "+" + s.slice(2);

  // Ensure leading +
  if (!s.startsWith("+")) s = "+" + s;

  // Iraqi local mobile: +07... → +9647...
  // A number like "07901234567" becomes "+07901234567" above, then we fix it.
  if (/^\+0[7-9]\d{8,9}$/.test(s)) {
    s = "+964" + s.slice(2); // drop the +0, prepend +964
  }

  return s;
}

function isValidE164(s: string): boolean {
  // E.164: +, then 7–15 digits
  return /^\+\d{7,15}$/.test(s);
}

export async function POST(req: NextRequest) {
  try {
    const { phone, locale = "en" } = await req.json() as { phone: string; locale?: string };

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

    const message = buildOtpMessage(normalised, code, locale);
    const sent = await sendWhatsApp(normalised, message);

    // Always log server-side so dev environments can complete auth without WhatsApp configured
    console.log(`[OTP] ${normalised} → ${code}${sent ? " (sent via WhatsApp)" : " (WhatsApp not configured — dev only)"}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
