// Jorrey Service Worker — vanilla, no build step required
const V = "v1";
const CORE   = `jorrey-core-${V}`;
const PAGES  = `jorrey-pages-${V}`;
const API    = `jorrey-api-${V}`;
const STATIC = `jorrey-static-${V}`;
const IMGS   = `jorrey-imgs-${V}`;
const FONTS  = `jorrey-fonts-${V}`;

const OFFLINE_URL = "/offline.html";

// Routes that must never be cached
function isPrivate(url) {
  return (
    /^\/(sign-in|sign-up|checkout)/.test(url.pathname) ||
    /^\/api\/(auth|orders|customers|push)/.test(url.pathname)
  );
}

// ── Install: pre-cache the standalone offline page ────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE).then((c) => c.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// ── Activate: evict stale caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const live = new Set([CORE, PAGES, API, STATIC, IMGS, FONTS]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !live.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isPrivate(url)) return;

  // Versioned Next.js JS/CSS — cache-first (hashed filenames are immutable)
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  // Next.js image optimisation — stale-while-revalidate
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(swr(request, IMGS));
    return;
  }

  // Cloudinary product images — cache-first
  if (url.hostname === "res.cloudinary.com") {
    event.respondWith(cacheFirst(request, IMGS));
    return;
  }

  // Google Fonts — cache-first
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request, FONTS));
    return;
  }

  // Public API data — network-first with cache fallback
  if (/^\/api\/(products|categories|settings|pages)/.test(url.pathname)) {
    event.respondWith(networkFirst(request, API, 8000));
    return;
  }

  // HTML navigation — network-first, serve /offline.html on failure
  if (request.mode === "navigate") {
    event.respondWith(navigateOrOffline(request));
    return;
  }
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function swr(request, cacheName) {
  const cache   = await caches.open(cacheName);
  const cached  = await cache.match(request);
  const refresh = fetch(request).then((r) => {
    if (r.ok) cache.put(request, r.clone());
    return r;
  }).catch(() => null);
  return cached ?? (await refresh);
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    clearTimeout(timer);
    return (await cache.match(request)) ?? new Response("", { status: 503 });
  }
}

async function navigateOrOffline(request) {
  try {
    const response = await networkFirst(request, PAGES, 10000);
    if (response.status !== 503) return response;
    throw new Error("offline");
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? new Response("Offline", { status: 503 });
  }
}

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Jorrey", {
      body:   data.body  ?? "",
      icon:   "/icons/icon-192.png",
      badge:  "/icons/badge-72.png",
      tag:    "jorrey-order",
      data:   { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if (c.url === url) return c.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
