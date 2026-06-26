import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "Jorrey <notifications@jorrey.com>";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  if (!resend || !to) return;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch {
    // fail silently — email is best-effort
  }
}

// WhatsApp via Meta Cloud API. Requires env vars:
//   WHATSAPP_API_TOKEN       — permanent token from Meta Business
//   WHATSAPP_PHONE_NUMBER_ID — sender phone number ID
// If not configured, silently skips (no error thrown).
export async function sendWhatsApp(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || !to) return;

  // Normalise: strip non-digits and ensure leading +
  const normalised = to.replace(/\D/g, "");
  if (!normalised) return;

  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalised,
          type: "text",
          text: { body: text },
        }),
      }
    );
  } catch {
    // fail silently
  }
}

export function priceDrophHtml(productName: string, oldPrice: number, newPrice: number, currency: string): string {
  return `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
      <h1 style="font-size:28px;letter-spacing:0.1em;margin-bottom:8px;">JORREY</h1>
      <hr style="border:none;border-top:1px solid #c9a96e;margin-bottom:32px;">
      <h2 style="font-size:18px;font-weight:normal;margin-bottom:16px;">Price Drop Alert</h2>
      <p style="font-size:15px;color:#555;line-height:1.6;">
        Good news! <strong>${productName}</strong> is now on sale.
      </p>
      <p style="font-size:22px;margin:24px 0;">
        <span style="text-decoration:line-through;color:#999;font-size:16px;">${currency}${oldPrice.toLocaleString()}</span>
        &nbsp;→&nbsp;
        <span style="color:#c9a96e;font-weight:bold;">${currency}${newPrice.toLocaleString()}</span>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
      <p style="font-size:12px;color:#aaa;">You are receiving this because you added this item to your Watchlist on jorrey.com.</p>
    </div>
  `;
}

export function restockHtml(productName: string): string {
  return `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;color:#1a1a1a;">
      <h1 style="font-size:28px;letter-spacing:0.1em;margin-bottom:8px;">JORREY</h1>
      <hr style="border:none;border-top:1px solid #c9a96e;margin-bottom:32px;">
      <h2 style="font-size:18px;font-weight:normal;margin-bottom:16px;">Back in Stock</h2>
      <p style="font-size:15px;color:#555;line-height:1.6;">
        <strong>${productName}</strong> is back in stock and available to order.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
      <p style="font-size:12px;color:#aaa;">You are receiving this because you added this item to your Watchlist on jorrey.com.</p>
    </div>
  `;
}

// ── Order confirmation ────────────────────────────────────────────────────────

import type { Order } from "./order-types";

export function buildOrderConfirmationHtml(order: Order): string {
  const isAr = order.locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const align = isAr ? "right" : "left";
  const sym = order.currencySymbol;
  const dateStr = new Date(order.createdAt).toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const addr = order.address;
  const addrStr = [addr.street, addr.district, addr.city, addr.country, addr.zipCode]
    .filter(Boolean).join(", ");
  const itemRows = order.items.map((item) => {
    const name = isAr && item.nameAr ? item.nameAr : item.name;
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #EDE8DE;color:#0C0C0C">${name} ×${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #EDE8DE;text-align:${align}">${sym}${(item.unitPrice * item.quantity).toLocaleString()}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html><html dir="${dir}" lang="${isAr ? "ar" : "en"}">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:${isAr ? "sans-serif" : "Georgia,serif"};direction:${dir}">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #EDE8DE">
  <tr><td style="background:#0C0C0C;padding:28px 36px;text-align:center">
    <span style="font-family:Georgia,serif;font-size:26px;letter-spacing:0.15em;color:#FAFAF7">JORREY</span>
  </td></tr>
  <tr><td style="padding:32px 36px 0;text-align:${align}">
    <h1 style="margin:0;font-size:20px;color:#0C0C0C;font-weight:normal">${isAr ? "✅ تم تأكيد طلبك" : "✅ Order Confirmed"}</h1>
    <p style="margin:8px 0 0;color:#888;font-size:13px">${isAr ? "رقم الطلب" : "Order"}: <strong>${order.id}</strong> · ${dateStr}</p>
  </td></tr>
  <tr><td style="padding:24px 36px 0">
    <table width="100%" cellpadding="0" cellspacing="0">${itemRows}
      <tr><td style="padding:10px 0 4px;color:#888;font-size:13px">${isAr ? "المجموع الفرعي" : "Subtotal"}</td><td style="text-align:${align}">${sym}${order.subtotal.toLocaleString()}</td></tr>
      <tr><td style="padding:4px 0;color:#888;font-size:13px">${isAr ? "الشحن" : "Shipping"}</td><td style="text-align:${align}">${order.shipping === 0 ? (isAr ? "مجاني" : "Free") : `${sym}${order.shipping.toLocaleString()}`}</td></tr>
      ${order.discount > 0 ? `<tr><td style="color:#888;font-size:13px">${isAr ? "الخصم" : "Discount"}</td><td style="text-align:${align};color:#C9A96E">-${sym}${order.discount.toLocaleString()}</td></tr>` : ""}
      <tr><td style="padding:12px 0 0;font-size:15px;font-weight:bold;border-top:2px solid #0C0C0C">${isAr ? "الإجمالي" : "Total"}</td><td style="text-align:${align};font-size:15px;font-weight:bold;border-top:2px solid #0C0C0C">${sym}${order.total.toLocaleString()}</td></tr>
    </table>
  </td></tr>
  ${addrStr ? `<tr><td style="padding:24px 36px 0;text-align:${align}">
    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888">${isAr ? "عنوان التوصيل" : "Delivery Address"}</p>
    <p style="margin:0;color:#0C0C0C;font-size:14px;line-height:1.6">${addr.name}<br/>${addrStr}</p>
  </td></tr>` : ""}
  <tr><td style="padding:32px 36px;text-align:center;border-top:1px solid #EDE8DE;margin-top:24px">
    <p style="margin:0;color:#888;font-size:13px">${isAr ? "شكراً لتسوقك مع جوري 🌿" : "Thank you for shopping with Jorrey 🌿"}</p>
  </td></tr>
</table></body></html>`;
}

export function buildOrderConfirmationWhatsApp(order: Order): string {
  const isAr = order.locale === "ar";
  const sym = order.currencySymbol;
  const dateStr = new Date(order.createdAt).toLocaleDateString(
    isAr ? "ar-SA" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const itemsBody = order.items.map((item, i) => {
    const name = isAr && item.nameAr ? item.nameAr : item.name;
    return `${i + 1}. ${name} ×${item.quantity} — ${sym}${(item.unitPrice * item.quantity).toLocaleString()}`;
  }).join("\n");

  const addr = order.address;
  const addrStr = [addr.street, addr.district, addr.city, addr.country].filter(Boolean).join(", ");

  if (isAr) {
    return `✅ *تم تأكيد طلبك — جوري*\n\n📋 *رقم الطلب:* ${order.id}\n📅 ${dateStr}\n\n📦 *المنتجات:*\n${itemsBody}\n\n${sym}${order.subtotal.toLocaleString()} :المجموع الفرعي\n${order.shipping === 0 ? "الشحن: مجاني" : `الشحن: ${sym}${order.shipping.toLocaleString()}`}${order.discount > 0 ? `\nالخصم: -${sym}${order.discount.toLocaleString()}` : ""}\n*الإجمالي: ${sym}${order.total.toLocaleString()}*${addrStr ? `\n\n📍 *عنوان التوصيل:*\n${addr.name}\n${addrStr}` : ""}\n\n🚚 التوصيل المتوقع: 3-5 أيام عمل\n\nشكراً لتسوقك مع جوري 🌿`;
  }
  return `✅ *Order Confirmed — Jorrey*\n\n📋 *Order #:* ${order.id}\n📅 ${dateStr}\n\n📦 *Items:*\n${itemsBody}\n\nSubtotal: ${sym}${order.subtotal.toLocaleString()}\nShipping: ${order.shipping === 0 ? "Free" : `${sym}${order.shipping.toLocaleString()}`}${order.discount > 0 ? `\nDiscount: -${sym}${order.discount.toLocaleString()}` : ""}\n*Total: ${sym}${order.total.toLocaleString()}*${addrStr ? `\n\n📍 *Delivery Address:*\n${addr.name}\n${addrStr}` : ""}\n\n🚚 Estimated Delivery: 3-5 business days\n\nThank you for shopping with Jorrey 🌿`;
}

// ── Status-change notifications ───────────────────────────────────────────────

import type { OrderStatus } from "./order-types";

const STATUS_LABEL: Record<OrderStatus, { en: string; ar: string }> = {
  processing: { en: "Processing", ar: "قيد المعالجة" },
  shipped:    { en: "Shipped",    ar: "تم الشحن" },
  delivered:  { en: "Delivered",  ar: "تم التوصيل" },
  cancelled:  { en: "Cancelled",  ar: "ملغي" },
};

export function buildStatusUpdateWhatsApp(order: Order, status: OrderStatus): string {
  const isAr = order.locale === "ar";
  const label = isAr ? STATUS_LABEL[status].ar : STATUS_LABEL[status].en;
  if (isAr) {
    return `📦 *تحديث طلبك — جوري*\n\nرقم الطلب: ${order.id}\n\nالحالة الجديدة: *${label}*\n\nشكراً لتسوقك مع جوري 🌿`;
  }
  return `📦 *Order Update — Jorrey*\n\nOrder #: ${order.id}\n\nNew status: *${label}*\n\nThank you for shopping with Jorrey 🌿`;
}

export function buildStatusUpdateHtml(order: Order, status: OrderStatus): string {
  const isAr = order.locale === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const label = isAr ? STATUS_LABEL[status].ar : STATUS_LABEL[status].en;
  const subjectLine = isAr
    ? `تحديث طلبك — ${label}`
    : `Order Update — ${label}`;
  return `<!DOCTYPE html><html dir="${dir}">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Georgia,serif;direction:${dir}">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #EDE8DE">
  <tr><td style="background:#0C0C0C;padding:24px 36px;text-align:center">
    <span style="font-family:Georgia,serif;font-size:24px;letter-spacing:0.15em;color:#FAFAF7">JORREY</span>
  </td></tr>
  <tr><td style="padding:32px 36px;text-align:${isAr ? "right" : "left"}">
    <h1 style="margin:0 0 12px;font-size:20px;color:#0C0C0C;font-weight:normal">${subjectLine}</h1>
    <p style="margin:0 0 8px;color:#555;font-size:14px">${isAr ? "رقم الطلب" : "Order"}: <strong>${order.id}</strong></p>
    <p style="margin:16px 0 0;font-size:16px;color:#0C0C0C">
      ${isAr ? "الحالة الجديدة:" : "New status:"} <strong>${label}</strong>
    </p>
  </td></tr>
  <tr><td style="padding:24px 36px;text-align:center;border-top:1px solid #EDE8DE">
    <p style="margin:0;color:#888;font-size:13px">${isAr ? "شكراً لتسوقك مع جوري 🌿" : "Thank you for shopping with Jorrey 🌿"}</p>
  </td></tr>
</table></body></html>`;
}

export async function sendStatusUpdateNotification(order: Order, status: OrderStatus): Promise<void> {
  const waMsg = buildStatusUpdateWhatsApp(order, status);
  const html = buildStatusUpdateHtml(order, status);
  const subject = order.locale === "ar"
    ? `تحديث طلبك — ${STATUS_LABEL[status].ar} — ${order.id}`
    : `Order Update — ${STATUS_LABEL[status].en} — ${order.id}`;
  await Promise.all([
    order.customerEmail ? sendEmail({ to: order.customerEmail, subject, html }) : Promise.resolve(),
    order.customerWhatsapp ? sendWhatsApp(order.customerWhatsapp, waMsg) : Promise.resolve(),
  ]);
}

export async function sendOrderConfirmation(order: Order): Promise<void> {
  const [emailHtml, waMsg] = [buildOrderConfirmationHtml(order), buildOrderConfirmationWhatsApp(order)];
  const subject = order.locale === "ar" ? `تأكيد طلبك — ${order.id}` : `Order Confirmed — ${order.id}`;
  await Promise.all([
    order.customerEmail ? sendEmail({ to: order.customerEmail, subject, html: emailHtml }) : Promise.resolve(),
    order.customerWhatsapp ? sendWhatsApp(order.customerWhatsapp, waMsg) : Promise.resolve(),
  ]);
}

// ── OTP for phone/WhatsApp verification ──────────────────────────────────────

interface OtpRecord { code: string; expiresAt: number; attempts: number }
const devOtpStore = new Map<string, OtpRecord>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(phone: string, code: string): Promise<void> {
  const expiresAt = Date.now() + 10 * 60 * 1000;
  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
    await redis.set(`otp:${phone}`, JSON.stringify({ code, expiresAt, attempts: 0 }), { ex: 600 });
  } else {
    devOtpStore.set(phone, { code, expiresAt, attempts: 0 });
  }
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<"ok" | "expired" | "invalid" | "max_attempts"> {
  let record: OtpRecord | null = null;
  let redis: import("@upstash/redis").Redis | null = null;

  if (process.env.VERCEL && process.env.UPSTASH_REDIS_REST_URL) {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
    const raw = await redis.get<string | OtpRecord>(`otp:${phone}`);
    if (raw) record = typeof raw === "string" ? JSON.parse(raw) : raw;
  } else {
    record = devOtpStore.get(phone) ?? null;
  }

  if (!record) return "expired";
  if (Date.now() > record.expiresAt) return "expired";

  record.attempts += 1;
  if (record.attempts >= 5) {
    redis ? await redis.del(`otp:${phone}`) : devOtpStore.delete(phone);
    return "max_attempts";
  }

  if (record.code !== code) {
    if (redis) await redis.set(`otp:${phone}`, JSON.stringify(record), { ex: 600 });
    else devOtpStore.set(phone, record);
    return "invalid";
  }

  redis ? await redis.del(`otp:${phone}`) : devOtpStore.delete(phone);
  return "ok";
}

export function buildOtpMessage(phone: string, code: string, locale: string): string {
  void phone;
  if (locale === "ar") return `رمز التحقق الخاص بك في جوري هو: ${code}. صالح لمدة 10 دقائق.`;
  return `Your Jorrey verification code is: ${code}. Valid for 10 minutes.`;
}

export function priceDropWhatsApp(productName: string, oldPrice: number, newPrice: number, currency: string): string {
  return `🏷️ *Price Drop Alert — JORREY*\n\n*${productName}* is now on sale!\n\n${currency}${oldPrice.toLocaleString()} → *${currency}${newPrice.toLocaleString()}*\n\nShop now at jorrey.com`;
}

export function restockWhatsApp(productName: string): string {
  return `📦 *Back in Stock — JORREY*\n\n*${productName}* is back in stock and ready to order.\n\nShop now at jorrey.com`;
}
