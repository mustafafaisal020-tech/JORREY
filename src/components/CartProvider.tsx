"use client";

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";

export interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  nameAr?: string;
  price: number;
  sku: string;
  color: string;
  size: string;
  image: string;
  quantity: number;
  category?: string;
}

interface CartState {
  items: CartItem[];
  open: boolean;
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; cartId: string }
  | { type: "UPDATE_QTY"; cartId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "SET_OPEN"; open: boolean }
  | { type: "HYDRATE"; items: CartItem[] };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.items };
    case "ADD": {
      const existing = state.items.find(
        (i) => i.productId === action.item.productId && i.size === action.item.size
      );
      if (existing) {
        return {
          ...state,
          open: true,
          items: state.items.map((i) =>
            i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, open: true, items: [...state.items, action.item] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.cartId !== action.cartId) };
    case "UPDATE_QTY":
      return {
        ...state,
        items: state.items
          .map((i) => (i.cartId === action.cartId ? { ...i, quantity: action.quantity } : i))
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "SET_OPEN":
      return { ...state, open: action.open };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  open: boolean;
  addItem: (item: Omit<CartItem, "cartId" | "quantity">) => void;
  removeItem: (cartId: string) => void;
  updateQty: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jorrey_cart");
      if (saved) dispatch({ type: "HYDRATE", items: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem("jorrey_cart", JSON.stringify(state.items)); } catch {}
  }, [state.items]);

  const addItem = useCallback((item: Omit<CartItem, "cartId" | "quantity">) => {
    dispatch({ type: "ADD", item: { ...item, cartId: `${item.productId}-${item.size}-${Date.now()}`, quantity: 1 } });
  }, []);

  const removeItem = useCallback((cartId: string) => dispatch({ type: "REMOVE", cartId }), []);
  const updateQty = useCallback((cartId: string, quantity: number) => dispatch({ type: "UPDATE_QTY", cartId, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const setOpen = useCallback((open: boolean) => dispatch({ type: "SET_OPEN", open }), []);

  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, clearCart, setOpen, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
