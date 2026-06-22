export interface CustomerAddress {
  street?: string;
  city?: string;
  district?: string;
  country?: string;
  zipCode?: string;
}

export type NotificationChannel = "email" | "whatsapp" | "both";

export interface WatchlistItem {
  productId: string;
  productName: string;
  addedAt: string;
  priceAtAdd: number;
  notifyPriceDrop: boolean;
  notifyRestock: boolean;
  notificationChannel: NotificationChannel;
}

export interface FavoriteItem {
  productId: string;
  productName: string;
  addedAt: string;
}

export interface InAppNotification {
  id: string;
  type: "price_drop" | "restock";
  productId: string;
  productName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: CustomerAddress;
  watchlist: WatchlistItem[];
  favorites: FavoriteItem[];
  notifications: InAppNotification[];
  createdAt: string;
  updatedAt: string;
}

export type CustomerProfileInput = Omit<CustomerProfile, "id" | "createdAt" | "updatedAt">;
