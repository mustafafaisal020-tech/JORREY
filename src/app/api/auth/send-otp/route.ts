import { NextRequest, NextResponse } from "next/server";
import { generateOtp, storeOtp, sendWhatsApp, buildOtpMessage } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { phone, locale = "en" } = await req.json() as { phone: string; locale?: string };

    if (!phone || phone.trim().length < 7) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const normalised = phone.replace(/\s/g, "");
    const code = generateOtp();
    await storeOtp(normalised, code);

    const message = buildOtpMessage(normalised, code, locale);
    await sendWhatsApp(normalised, message);

    // In dev without WhatsApp API configured, code is also logged server-side
    console.log(`[OTP] Code for ${normalised}: ${code}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
