export interface CustomerAddress {
  street?: string;
  city?: string;
  district?: string;
  country?: string;
  zipCode?: string;
}

export interface WatchlistItem {
  productId: string;
  productName: string;
  addedAt: string;
  priceAtAdd: number;
  notifyPriceDrop: boolean;
  notifyRestock: boolean;
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
  address?: CustomerAddress;
  watchlist: WatchlistItem[];
  favorites: FavoriteItem[];
  notifications: InAppNotification[];
  createdAt: string;
  updatedAt: string;
}

export type CustomerProfileInput = Omit<CustomerProfile, "id" | "createdAt" | "updatedAt">;
