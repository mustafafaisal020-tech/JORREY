"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

const SUBSCRIBED_KEY = "push-subscribed-v1";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(safe);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

async function subscribeToPush(locale: string): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), locale }),
  });

  localStorage.setItem(SUBSCRIBED_KEY, "1");
}

// Silently subscribes when the user is already signed in AND has already
// granted notification permission (e.g., from a previous visit or a
// browser-level prompt). Does NOT request permission on its own.
export default function PushSubscriptionSetup() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;
    if (Notification.permission !== "granted") return;

    // Read locale from html[lang] — avoids next-intl provider dependency
    const locale = document.documentElement.lang ?? "en";
    subscribeToPush(locale).catch(() => {});
  }, [isSignedIn]);

  return null;
}

// Call this when the user explicitly clicks "Enable notifications"
export async function requestAndSubscribePush(locale: string): Promise<boolean> {
  if (!("Notification" in window) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  await subscribeToPush(locale);
  return true;
}
