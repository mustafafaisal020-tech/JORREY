import { getOrders } from "@/lib/orders";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <OrdersClient initialOrders={orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())} />;
}
