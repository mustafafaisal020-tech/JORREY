import webpush from "web-push";
import { readStore, writeStore } from "./blob-store";

export interface StoredPushSubscription {
  userId: string;
  locale: string;
  subscription: webpush.PushSubscription;
}

const STORE_KEY = "push-subscriptions";

// Initialise VAPID once on cold start (keys are optional — push is a no-op without them)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hello@jorrey.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function getAllSubscriptions(): Promise<StoredPushSubscription[]> {
  return readStore<StoredPushSubscription[]>(STORE_KEY, []);
}

export async function savePushSubscription(
  entry: StoredPushSubscription
): Promise<void> {
  const all = await getAllSubscriptions();
  const idx = all.findIndex((s) => s.userId === entry.userId);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.push(entry);
  }
  await writeStore(STORE_KEY, all);
}

export async function removePushSubscription(userId: string): Promise<void> {
  const all = await getAllSubscriptions();
  await writeStore(
    STORE_KEY,
    all.filter((s) => s.userId !== userId)
  );
}

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  processing: { en: "Order Processing",   ar: "جارٍ معالجة طلبك" },
  shipped:    { en: "Order Shipped",      ar: "تم شحن طلبك" },
  delivered:  { en: "Order Delivered!",   ar: "تم توصيل طلبك!" },
  cancelled:  { en: "Order Cancelled",    ar: "تم إلغاء طلبك" },
};

export async function sendOrderPush(
  userId: string,
  status: string,
  orderId: string
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const all = await getAllSubscriptions();
  const entry = all.find((s) => s.userId === userId);
  if (!entry) return;

  const ar = entry.locale === "ar";
  const label = STATUS_LABELS[status] ?? { en: "Order Update", ar: "تحديث الطلب" };

  try {
    await webpush.sendNotification(
      entry.subscription,
      JSON.stringify({
        title: ar ? label.ar : label.en,
        body: ar ? `رقم الطلب: ${orderId}` : `Order #${orderId}`,
        url: "/",
      })
    );
  } catch (err: unknown) {
    // Subscription expired — clean it up
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      await removePushSubscription(userId);
    }
  }
}
