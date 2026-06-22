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

export function priceDropWhatsApp(productName: string, oldPrice: number, newPrice: number, currency: string): string {
  return `🏷️ *Price Drop Alert — JORREY*\n\n*${productName}* is now on sale!\n\n${currency}${oldPrice.toLocaleString()} → *${currency}${newPrice.toLocaleString()}*\n\nShop now at jorrey.com`;
}

export function restockWhatsApp(productName: string): string {
  return `📦 *Back in Stock — JORREY*\n\n*${productName}* is back in stock and ready to order.\n\nShop now at jorrey.com`;
}
