import { readStore, writeStore } from "./blob-store";
import type { Order, OrderStatus } from "./order-types";

const KEY = "orders";

export async function getOrders(): Promise<Order[]> {
  return readStore<Order[]>(KEY, []);
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const all = await getOrders();
  return all
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrder(id: string): Promise<Order | null> {
  const all = await getOrders();
  return all.find((o) => o.id === id) ?? null;
}

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<Order> {
  const all = await getOrders();
  const now = new Date().toISOString();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const id = `ORD-${Date.now()}-${rand}`;
  const order: Order = { ...data, id, createdAt: now, updatedAt: now };
  await writeStore(KEY, [...all, order]);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  const all = await getOrders();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
  await writeStore(KEY, all);
  return all[idx];
}
