"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/lib/order-types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  processing: "bg-yellow-100 text-yellow-800",
  shipped:    "bg-blue-100 text-blue-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped:    "Shipped",
  delivered:  "Delivered",
  cancelled:  "Cancelled",
};

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated: Order = await res.json();
        setOrders((prev) => prev.map((o) => o.id === orderId ? updated : o));
        if (selected?.id === orderId) setSelected(updated);
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Order list */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl text-jorrey-black tracking-wide">Orders</h1>
          <span className="text-sm text-gray-400">{orders.length} orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="border border-gray-100 p-12 text-center text-gray-400">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left border p-4 transition-colors hover:border-jorrey-gold/30 ${
                  selected?.id === order.id ? "border-jorrey-gold bg-jorrey-beige/10" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500 mb-1">{order.id}</p>
                    <p className="text-sm font-medium text-jorrey-black">{order.address.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                      {order.currencySymbol}{order.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order detail panel */}
      {selected && (
        <div className="w-96 shrink-0 border-s border-gray-100 ps-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono text-xs text-gray-400">{selected.id}</p>
              <p className="font-serif text-lg text-jorrey-black mt-0.5">{selected.address.name}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs mt-1">
              ✕
            </button>
          </div>

          {/* Status picker */}
          <div className="mb-5">
            <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-1.5">
              {(["processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={updating === selected.id}
                  onClick={() => handleStatusChange(selected.id, s)}
                  className={`text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 transition-colors ${
                    selected.status === s
                      ? STATUS_COLORS[s] + " opacity-100"
                      : "border border-gray-200 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-3">Items</p>
            <div className="space-y-2">
              {selected.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-jorrey-black">
                    {item.name}
                    {item.size && item.size !== "One Size" && <span className="text-gray-400 ms-1">/ {item.size}</span>}
                    <span className="text-gray-400 ms-1">×{item.quantity}</span>
                  </span>
                  <span className="font-medium">{selected.currencySymbol}{(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm mb-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{selected.currencySymbol}{selected.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span><span>{selected.shipping === 0 ? "Free" : `${selected.currencySymbol}${selected.shipping.toLocaleString()}`}</span>
            </div>
            {selected.discount > 0 && (
              <div className="flex justify-between text-jorrey-gold">
                <span>Discount</span><span>-{selected.currencySymbol}{selected.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-gray-100 pt-2">
              <span>Total</span><span>{selected.currencySymbol}{selected.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-gray-100 pt-3 text-sm mb-4">
            <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">Delivery Address</p>
            <p className="text-gray-600 leading-relaxed">
              {[selected.address.street, selected.address.district, selected.address.city, selected.address.country, selected.address.zipCode]
                .filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Customer info */}
          {(selected.customerEmail || selected.customerPhone || selected.customerWhatsapp) && (
            <div className="border-t border-gray-100 pt-3 text-sm">
              <p className="text-[10px] tracking-widests uppercase text-gray-400 mb-2">Customer</p>
              {selected.customerEmail && <p className="text-gray-600">{selected.customerEmail}</p>}
              {selected.customerPhone && <p className="text-gray-600">{selected.customerPhone}</p>}
            </div>
          )}

          <p className="text-[10px] text-gray-300 mt-4">
            Placed {new Date(selected.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      )}
    </div>
  );
}
