import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getProduct, updateProduct, archiveProduct } from "@/lib/products";
import { getWatchersForProduct, addNotification } from "@/lib/customers";
import {
  sendEmail,
  sendWhatsApp,
  priceDrophHtml,
  restockHtml,
  priceDropWhatsApp,
  restockWhatsApp,
} from "@/lib/email";
import { getSettings } from "@/lib/settings";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();

    const oldProduct = await getProduct(id);
    const product = await updateProduct(id, body, userId);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (oldProduct) {
      triggerWatchlistNotifications(oldProduct, product).catch(() => {});
    }

    return NextResponse.json(product);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update product";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// Soft-deletes (archives) the product — recoverable from admin archive page
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await archiveProduct(id, userId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, archived: true });
}

async function triggerWatchlistNotifications(
  oldProduct: Awaited<ReturnType<typeof getProduct>>,
  newProduct: Awaited<ReturnType<typeof getProduct>>
) {
  if (!oldProduct || !newProduct) return;

  const watchers = await getWatchersForProduct(newProduct.id);
  if (watchers.length === 0) return;

  const settings = await getSettings();
  const currency = settings.currencySymbol ?? "$";

  const priceDrop =
    newProduct.price < oldProduct.price ||
    (newProduct.salePrice != null &&
      (oldProduct.salePrice == null || newProduct.salePrice < oldProduct.salePrice));

  const restocked = oldProduct.inStock === false && newProduct.inStock !== false;

  for (const watcher of watchers) {
    const item = watcher.watchlist.find((w) => w.productId === newProduct.id);
    if (!item) continue;

    const channel = item.notificationChannel ?? "email";
    const wantsEmail = channel === "email" || channel === "both";
    const wantsWhatsApp = channel === "whatsapp" || channel === "both";
    const whatsappTo = watcher.whatsappNumber ?? watcher.phone ?? "";

    if (priceDrop && item.notifyPriceDrop) {
      const effectiveOld = oldProduct.salePrice ?? oldProduct.price;
      const effectiveNew = newProduct.salePrice ?? newProduct.price;
      await addNotification(watcher.id, {
        type: "price_drop",
        productId: newProduct.id,
        productName: newProduct.name,
        message: `Price dropped from ${currency}${effectiveOld.toLocaleString()} to ${currency}${effectiveNew.toLocaleString()}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      if (wantsEmail) {
        await sendEmail({
          to: watcher.email,
          subject: `Price Drop: ${newProduct.name}`,
          html: priceDrophHtml(newProduct.name, effectiveOld, effectiveNew, currency),
        });
      }
      if (wantsWhatsApp) {
        await sendWhatsApp(whatsappTo, priceDropWhatsApp(newProduct.name, effectiveOld, effectiveNew, currency));
      }
    }

    if (restocked && item.notifyRestock) {
      await addNotification(watcher.id, {
        type: "restock",
        productId: newProduct.id,
        productName: newProduct.name,
        message: `${newProduct.name} is back in stock`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      if (wantsEmail) {
        await sendEmail({
          to: watcher.email,
          subject: `Back in Stock: ${newProduct.name}`,
          html: restockHtml(newProduct.name),
        });
      }
      if (wantsWhatsApp) {
        await sendWhatsApp(whatsappTo, restockWhatsApp(newProduct.name));
      }
    }
  }
}
