import { randomUUID } from "crypto";
import { readStore, writeStore } from "./blob-store";
import type {
  CustomerProfile,
  CustomerProfileInput,
  WatchlistItem,
  FavoriteItem,
  InAppNotification,
} from "./customer-types";

export type {
  CustomerProfile,
  CustomerProfileInput,
  CustomerAddress,
  WatchlistItem,
  FavoriteItem,
  InAppNotification,
} from "./customer-types";

const KEY = "customers";
const MAX_NOTIFICATIONS = 50;

function normalize(raw: Record<string, unknown>): CustomerProfile {
  const p = raw as unknown as CustomerProfile;
  return {
    ...p,
    watchlist: Array.isArray(raw.watchlist) ? (raw.watchlist as WatchlistItem[]) : [],
    favorites: Array.isArray(raw.favorites) ? (raw.favorites as FavoriteItem[]) : [],
    notifications: Array.isArray(raw.notifications)
      ? (raw.notifications as InAppNotification[])
      : [],
  };
}

async function read(): Promise<CustomerProfile[]> {
  const raw = await readStore<Record<string, unknown>[]>(KEY, []);
  return raw.map(normalize);
}

async function write(data: CustomerProfile[]): Promise<void> {
  return writeStore(KEY, data);
}

export async function getCustomers(): Promise<CustomerProfile[]> {
  return (await read()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCustomer(id: string): Promise<CustomerProfile | undefined> {
  return (await read()).find((c) => c.id === id);
}

export async function upsertCustomer(
  id: string,
  input: CustomerProfileInput
): Promise<CustomerProfile> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === id);
  const now = new Date().toISOString();
  if (idx !== -1) {
    // Preserve lists on profile upsert — don't overwrite with whatever input provides
    all[idx] = {
      ...all[idx],
      ...input,
      watchlist: all[idx].watchlist,
      favorites: all[idx].favorites,
      notifications: all[idx].notifications,
      id,
      updatedAt: now,
    };
    await write(all);
    return all[idx];
  }
  const profile: CustomerProfile = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await write([...all, profile]);
  return profile;
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerProfileInput>
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...input, updatedAt: new Date().toISOString() };
  await write(all);
  return all[idx];
}

// ── Watchlist ──────────────────────────────────────────────────────────────

export async function addToWatchlist(
  customerId: string,
  item: WatchlistItem
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  const existing = all[idx].watchlist.findIndex((w) => w.productId === item.productId);
  if (existing !== -1) {
    all[idx].watchlist[existing] = item;
  } else {
    all[idx].watchlist.push(item);
  }
  all[idx].updatedAt = new Date().toISOString();
  await write(all);
  return all[idx];
}

export async function removeFromWatchlist(
  customerId: string,
  productId: string
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  all[idx].watchlist = all[idx].watchlist.filter((w) => w.productId !== productId);
  all[idx].updatedAt = new Date().toISOString();
  await write(all);
  return all[idx];
}

// ── Favorites ──────────────────────────────────────────────────────────────

export async function addToFavorites(
  customerId: string,
  item: FavoriteItem
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  if (!all[idx].favorites.some((f) => f.productId === item.productId)) {
    all[idx].favorites.push(item);
    all[idx].updatedAt = new Date().toISOString();
    await write(all);
  }
  return all[idx];
}

export async function removeFromFavorites(
  customerId: string,
  productId: string
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  all[idx].favorites = all[idx].favorites.filter((f) => f.productId !== productId);
  all[idx].updatedAt = new Date().toISOString();
  await write(all);
  return all[idx];
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function addNotification(
  customerId: string,
  notification: Omit<InAppNotification, "id">
): Promise<void> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === customerId);
  if (idx === -1) return;
  all[idx].notifications.unshift({ ...notification, id: randomUUID() });
  if (all[idx].notifications.length > MAX_NOTIFICATIONS) {
    all[idx].notifications = all[idx].notifications.slice(0, MAX_NOTIFICATIONS);
  }
  all[idx].updatedAt = new Date().toISOString();
  await write(all);
}

export async function markNotificationsRead(
  customerId: string,
  notificationIds?: string[]
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === customerId);
  if (idx === -1) return null;
  all[idx].notifications = all[idx].notifications.map((n) => {
    if (!notificationIds || notificationIds.includes(n.id)) return { ...n, read: true };
    return n;
  });
  all[idx].updatedAt = new Date().toISOString();
  await write(all);
  return all[idx];
}

export async function getWatchersForProduct(productId: string): Promise<CustomerProfile[]> {
  return (await read()).filter((c) => c.watchlist.some((w) => w.productId === productId));
}

// ── Auto-ensure customer exists (for watchlist/favorites without profile save) ──

export async function ensureCustomer(
  id: string,
  email: string,
  firstName: string
): Promise<CustomerProfile> {
  const existing = await getCustomer(id);
  if (existing) return existing;
  return upsertCustomer(id, {
    email,
    firstName: firstName || "User",
    watchlist: [],
    favorites: [],
    notifications: [],
  });
}
