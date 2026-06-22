"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import type { WatchlistItem, FavoriteItem, InAppNotification } from "@/lib/customer-types";

interface UserListsContextValue {
  favorites: FavoriteItem[];
  watchlist: WatchlistItem[];
  notifications: InAppNotification[];
  unreadNotifications: number;
  isFavorite: (productId: string) => boolean;
  isWatched: (productId: string) => boolean;
  toggleFavorite: (productId: string, productName: string) => Promise<void>;
  toggleWatchlist: (productId: string, productName: string, price: number) => Promise<void>;
  updateWatchlistPrefs: (
    productId: string,
    prefs: { notifyPriceDrop: boolean; notifyRestock: boolean }
  ) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshLists: () => void;
}

const UserListsContext = createContext<UserListsContextValue>({
  favorites: [],
  watchlist: [],
  notifications: [],
  unreadNotifications: 0,
  isFavorite: () => false,
  isWatched: () => false,
  toggleFavorite: async () => {},
  toggleWatchlist: async () => {},
  updateWatchlistPrefs: async () => {},
  markAllRead: async () => {},
  refreshLists: () => {},
});

export function useUserLists() {
  return useContext(UserListsContext);
}

export default function UserListsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchLists = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setWatchlist([]);
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }
    try {
      const [favRes, watchRes, notifRes] = await Promise.all([
        fetch("/api/customers/me/favorites"),
        fetch("/api/customers/me/watchlist"),
        fetch("/api/customers/me/notifications"),
      ]);
      if (favRes.ok) setFavorites(await favRes.json());
      if (watchRes.ok) setWatchlist(await watchRes.json());
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications ?? []);
        setUnreadNotifications(data.unread ?? 0);
      }
    } catch {
      // fail silently
    }
  }, [user]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const isFavorite = (productId: string) => favorites.some((f) => f.productId === productId);
  const isWatched = (productId: string) => watchlist.some((w) => w.productId === productId);

  const toggleFavorite = async (productId: string, productName: string) => {
    if (!user) return;
    if (isFavorite(productId)) {
      setFavorites((prev) => prev.filter((f) => f.productId !== productId));
      await fetch(`/api/customers/me/favorites/${productId}`, { method: "DELETE" });
    } else {
      const item: FavoriteItem = { productId, productName, addedAt: new Date().toISOString() };
      setFavorites((prev) => [...prev, item]);
      await fetch("/api/customers/me/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productName }),
      });
    }
  };

  const toggleWatchlist = async (productId: string, productName: string, price: number) => {
    if (!user) return;
    if (isWatched(productId)) {
      setWatchlist((prev) => prev.filter((w) => w.productId !== productId));
      await fetch(`/api/customers/me/watchlist/${productId}`, { method: "DELETE" });
    } else {
      const item: WatchlistItem = {
        productId,
        productName,
        addedAt: new Date().toISOString(),
        priceAtAdd: price,
        notifyPriceDrop: true,
        notifyRestock: true,
      };
      setWatchlist((prev) => [...prev, item]);
      await fetch("/api/customers/me/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productName, priceAtAdd: price, notifyPriceDrop: true, notifyRestock: true }),
      });
    }
  };

  const updateWatchlistPrefs = async (
    productId: string,
    prefs: { notifyPriceDrop: boolean; notifyRestock: boolean }
  ) => {
    setWatchlist((prev) =>
      prev.map((w) => (w.productId === productId ? { ...w, ...prefs } : w))
    );
    await fetch(`/api/customers/me/watchlist/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifications(0);
    await fetch("/api/customers/me/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  };

  return (
    <UserListsContext.Provider
      value={{
        favorites,
        watchlist,
        notifications,
        unreadNotifications,
        isFavorite,
        isWatched,
        toggleFavorite,
        toggleWatchlist,
        updateWatchlistPrefs,
        markAllRead,
        refreshLists: fetchLists,
      }}
    >
      {children}
    </UserListsContext.Provider>
  );
}
