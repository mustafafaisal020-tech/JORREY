export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  nameAr?: string;
  sku: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  category?: string;
}

export interface OrderAddress {
  name: string;
  street?: string;
  district?: string;
  city?: string;
  country?: string;
  zipCode?: string;
}

export interface Order {
  id: string;
  /** Clerk userId — null for guest orders */
  customerId: string | null;
  customerEmail?: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  items: OrderItem[];
  address: OrderAddress;
  subtotal: number;
  /** Shipping cost in same currency */
  shipping: number;
  discount: number;
  total: number;
  currencySymbol: string;
  status: OrderStatus;
  /** "en" or "ar" — drives confirmation message language */
  locale: string;
  /** ISO date string for estimated delivery */
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
