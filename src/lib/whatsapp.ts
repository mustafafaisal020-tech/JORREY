/**
 * Twilio WhatsApp integration.
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 * Falls back gracefully (logs to console) when credentials are absent.
 */

export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    console.log("[WhatsApp] TWILIO_WHATSAPP_FROM not set — skipping Twilio send.");
    return false;
  }

  if (!sid || !token) {
    console.log("[WhatsApp] Twilio not configured. Message to", to, ":\n", body.slice(0, 120));
    return false;
  }

  const toFmt = to.startsWith("whatsapp:") ? to : `whatsapp:${to.replace(/\s/g, "")}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const creds = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: toFmt, Body: body }).toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[WhatsApp] Twilio error:", err.slice(0, 200));
    }
    return res.ok;
  } catch (e) {
    console.error("[WhatsApp] Network error:", e);
    return false;
  }
}

// ── OTP store (Redis for prod, in-memory for dev) ─────────────────────────────

interface OtpRecord { code: string; expiresAt: number; attempts: number }
const devOtpStore = new Map<string, OtpRecord>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(phone: string, code: string): Promise<void> {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set(`otp:${phone}`, JSON.stringify({ code, expiresAt, attempts: 0 }), { ex: 600 });
  } else {
    devOtpStore.set(phone, { code, expiresAt, attempts: 0 });
  }
}

export async function verifyOtp(phone: string, code: string): Promise<"ok" | "expired" | "invalid" | "max_attempts"> {
  let record: OtpRecord | null = null;

  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const raw = await redis.get<string>(`otp:${phone}`);
    if (raw) record = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (record) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        await redis.del(`otp:${phone}`);
        return "max_attempts";
      }
      await redis.set(`otp:${phone}`, JSON.stringify(record), { ex: 600 });
    }
  } else {
    record = devOtpStore.get(phone) ?? null;
    if (record) {
      record.attempts += 1;
      if (record.attempts >= 5) { devOtpStore.delete(phone); return "max_attempts"; }
    }
  }

  if (!record) return "expired";
  if (Date.now() > record.expiresAt) return "expired";
  if (record.code !== code) return "invalid";

  // Clean up on success
  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
    await redis.del(`otp:${phone}`);
  } else {
    devOtpStore.delete(phone);
  }
  return "ok";
}

// ── Order confirmation message builder ────────────────────────────────────────

import type { Order } from "./order-types";

export function buildOrderConfirmationMessage(order: Order): string {
  const isAr = order.locale === "ar";
  const sym = order.currencySymbol;

  const header = isAr
    ? `✅ *تم تأكيد طلبك — جوري*\n\n`
    : `✅ *Order Confirmed — Jorrey*\n\n`;

  const orderLine = isAr
    ? `📋 *رقم الطلب:* ${order.id}\n`
    : `📋 *Order #:* ${order.id}\n`;

  const dateOpts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  const dateStr = new Date(order.createdAt).toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    dateOpts
  );
  const dateLine = isAr ? `📅 *التاريخ:* ${dateStr}\n\n` : `📅 *Date:* ${dateStr}\n\n`;

  const itemsHeader = isAr ? `📦 *المنتجات:*\n` : `📦 *Items:*\n`;
  const itemsBody = order.items.map((item, i) => {
    const name = isAr && item.nameAr ? item.nameAr : item.name;
    const lineTotal = (item.unitPrice * item.quantity).toLocaleString();
    return `${i + 1}. ${name} × ${item.quantity} — ${sym}${lineTotal}`;
  }).join("\n");

  const subtotalLine = isAr
    ? `\n\n${sym}${order.subtotal.toLocaleString()} :المجموع الفرعي`
    : `\n\nSubtotal: ${sym}${order.subtotal.toLocaleString()}`;

  const shippingLine = order.shipping === 0
    ? (isAr ? `\nالشحن: مجاني` : `\nShipping: Free`)
    : (isAr ? `\nالشحن: ${sym}${order.shipping.toLocaleString()}` : `\nShipping: ${sym}${order.shipping.toLocaleString()}`);

  const discountLine = order.discount > 0
    ? (isAr ? `\nالخصم: -${sym}${order.discount.toLocaleString()}` : `\nDiscount: -${sym}${order.discount.toLocaleString()}`)
    : "";

  const totalLine = isAr
    ? `\n*الإجمالي: ${sym}${order.total.toLocaleString()}*`
    : `\n*Total: ${sym}${order.total.toLocaleString()}*`;

  const addr = order.address;
  const addrParts = [addr.street, addr.district, addr.city, addr.country, addr.zipCode]
    .filter(Boolean).join(", ");
  const addrBlock = addrParts
    ? (isAr
        ? `\n\n📍 *عنوان التوصيل:*\n${addr.name}\n${addrParts}`
        : `\n\n📍 *Delivery Address:*\n${addr.name}\n${addrParts}`)
    : "";

  const etaLine = order.estimatedDelivery
    ? (isAr ? `\n\n🚚 التوصيل المتوقع: 3-5 أيام عمل` : `\n\n🚚 Estimated Delivery: 3-5 business days`)
    : "";

  const signoff = isAr
    ? `\n\nشكراً لتسوقك مع جوري 🌿`
    : `\n\nThank you for shopping with Jorrey 🌿`;

  return header + orderLine + dateLine + itemsHeader + itemsBody +
    subtotalLine + shippingLine + discountLine + totalLine +
    addrBlock + etaLine + signoff;
}
