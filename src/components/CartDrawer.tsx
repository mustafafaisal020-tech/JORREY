"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartProvider";
import CheckoutModal from "./CheckoutModal";
import { useCurrency } from "./CurrencyProvider";
import { useTranslations } from "next-intl";

interface CartDrawerProps {
  whatsappNumber: string;
  currencySymbol?: string; // kept for API compat, context drives formatting
}

export default function CartDrawer({ whatsappNumber }: CartDrawerProps) {
  const { items, open, setOpen, removeItem, updateQty, total, count } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const t = useTranslations("cart");
  const { symbol: currencySymbol, format } = useCurrency();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col rounded-none border-s border-gray-100">
          <SheetHeader className="px-6 py-5 border-b border-gray-100">
            <SheetTitle className="font-serif text-lg flex items-center gap-2">
              <ShoppingBag size={18} />
              {t("title")}
              {count > 0 && (
                <span className="bg-jorrey-gold text-jorrey-black text-xs font-semibold px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <ShoppingBag size={40} className="text-gray-200" />
              <p className="text-gray-400 text-sm">{t("empty")}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="px-6 py-4 space-y-5">
                  {items.map((item) => (
                    <div key={item.cartId} className="flex gap-3">
                      <div className="w-16 h-20 bg-jorrey-beige relative flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.color} · {item.size}</p>
                        <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.cartId, item.quantity - 1)} className="w-6 h-6 border border-gray-200 flex items-center justify-center hover:border-jorrey-gold">
                            <Minus size={10} />
                          </button>
                          <span className="text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.cartId, item.quantity + 1)} className="w-6 h-6 border border-gray-200 flex items-center justify-center hover:border-jorrey-gold">
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {/* item.price is already converted at add-to-cart time */}
                        <span className="text-sm font-medium">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeItem(item.cartId)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="px-6 py-5 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{t("total")}</span>
                  <span>{currencySymbol}{total.toLocaleString()}</span>
                </div>
                <Button
                  onClick={() => { setOpen(false); setCheckoutOpen(true); }}
                  className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                >
                  {t("submit_order")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        whatsappNumber={whatsappNumber}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
