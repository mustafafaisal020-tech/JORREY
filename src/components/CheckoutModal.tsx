"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { CartItem } from "./CartProvider";
import type { CustomerProfile } from "@/lib/customer-types";

interface DeliveryForm {
  name: string;
  street: string;
  country: string;
  city: string;
  district: string;
  zipCode: string;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  whatsappNumber: string;
  currencySymbol: string;
}

function buildWhatsAppMessage(
  items: CartItem[],
  delivery: DeliveryForm,
  currencySymbol: string,
  siteUrl = "",
  locale = "en"
): string {
  const isAr = locale === "ar";
  const header = isAr ? `🛍 *طلب جوري*\n\n` : `🛍 *Jorrey Order*\n\n`;

  const addrParts = [
    delivery.street,
    delivery.district,
    delivery.city,
    delivery.country,
    delivery.zipCode,
  ].filter(Boolean).join(", ");

  const addressBlock =
    `*${isAr ? "العميل" : "Customer"}:* ${delivery.name}\n` +
    (addrParts ? `*${isAr ? "العنوان" : "Address"}:* ${addrParts}\n` : "") +
    `\n`;

  const itemsLabel = isAr ? "المنتجات" : "Items";
  const itemsBlock =
    `*${itemsLabel}:*\n` +
    items.map((item, i) => {
      const displayName = isAr && item.nameAr ? item.nameAr : item.name;
      const meta = [
        item.category ? `${isAr ? "الفئة" : "Category"}: ${item.category}` : null,
        `SKU: ${item.sku}`,
        item.color && item.color !== "N/A" && item.color !== "NA"
          ? `${isAr ? "اللون" : "Color"}: ${item.color}`
          : null,
        `${isAr ? "المقاس" : "Size"}: ${item.size}`,
      ].filter(Boolean).join(" | ");

      const linePrice = item.price * item.quantity;
      const qtyStr = item.quantity > 1 ? ` (×${item.quantity})` : "";

      return `${i + 1}. *${displayName}*\n   ${meta}\n   ${currencySymbol}${linePrice.toLocaleString()}${qtyStr}${item.image ? `\n   ${siteUrl}${item.image}` : ""}`;
    }).join("\n\n");

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalLabel = isAr ? "المجموع" : "Total";
  const totalBlock = `\n\n*${totalLabel}: ${currencySymbol}${total.toLocaleString()}*`;

  return header + addressBlock + itemsBlock + totalBlock;
}

function profileToForm(profile: CustomerProfile | null): Partial<DeliveryForm> {
  if (!profile) return {};
  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    street: profile.address?.street ?? "",
    city: profile.address?.city ?? "",
    district: profile.address?.district ?? "",
    country: profile.address?.country ?? "",
    zipCode: profile.address?.zipCode ?? "",
  };
}

function isFormComplete(f: DeliveryForm): boolean {
  return !!(f.name && f.country && f.city && f.district);
}

export default function CheckoutModal({ open, onClose, items, whatsappNumber, currencySymbol }: CheckoutModalProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { user, isLoaded } = useUser();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DeliveryForm>({ name: "", street: "", country: "", city: "", district: "", zipCode: "" });
  const [errors, setErrors] = useState<Partial<DeliveryForm>>({});

  // Load saved profile when modal opens and user is signed in
  useEffect(() => {
    if (!open) return;
    if (!isLoaded || !user) {
      setProfile(null);
      setEditing(true);
      return;
    }
    fetch("/api/customers/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data: CustomerProfile | null) => {
        setProfile(data);
        const prefill = profileToForm(data);
        const filled: DeliveryForm = {
          name: prefill.name ?? "",
          street: prefill.street ?? "",
          country: prefill.country ?? "",
          city: prefill.city ?? "",
          district: prefill.district ?? "",
          zipCode: prefill.zipCode ?? "",
        };
        setForm(filled);
        // Skip editing step if profile has complete address
        setEditing(!isFormComplete(filled));
      })
      .catch(() => { setProfile(null); setEditing(true); });
  }, [open, user, isLoaded]);

  function validate(): boolean {
    const e: Partial<DeliveryForm> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.country.trim()) e.country = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.district.trim()) e.district = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleCheckout() {
    if (!validate()) return;
    const msg = buildWhatsAppMessage(items, form, currencySymbol, window.location.origin, locale);
    const phone = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    onClose();
  }

  const f = (key: keyof DeliveryForm, label: string, placeholder: string, required = true) => (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-widest uppercase text-gray-500">
        {label}{required && " *"}
      </Label>
      <Input
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="rounded-none"
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="rounded-none max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{t("title")}</DialogTitle>
        </DialogHeader>

        {/* Order summary */}
        <div className="bg-jorrey-beige/50 p-4 space-y-2 mb-2">
          {items.map((item) => (
            <div key={item.cartId} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.name}
                <span className="text-gray-400 ms-1">× {item.quantity}</span>
                <span className="text-gray-400 ms-2 text-xs">{item.size}</span>
              </span>
              <span className="font-medium">{currencySymbol}{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-jorrey-beige-dark pt-2 flex justify-between font-semibold text-sm">
            <span>{t("total")}</span>
            <span>{currencySymbol}{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Saved address preview (logged-in, not editing) */}
        {!editing && isFormComplete(form) ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <p className="text-xs text-gray-400 tracking-widest uppercase">{t("saved_address")}</p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-jorrey-gold hover:text-jorrey-black flex items-center gap-1 transition-colors"
              >
                <Pencil size={11} />
                {t("edit_address")}
              </button>
            </div>
            <div className="bg-jorrey-beige/30 px-4 py-3 text-sm space-y-0.5">
              <p className="font-medium text-jorrey-black">{form.name}</p>
              {form.street && <p className="text-gray-500">{form.street}</p>}
              <p className="text-gray-500">
                {[form.district, form.city, form.country].filter(Boolean).join(", ")}
                {form.zipCode && ` ${form.zipCode}`}
              </p>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full rounded-none bg-[#25D366] hover:bg-[#20b858] text-white text-xs tracking-widest uppercase font-semibold py-5"
            >
              {t("confirm_order")}
            </Button>
          </div>
        ) : (
          /* Address form */
          <div className="space-y-4">
            <p className="text-xs text-gray-400 tracking-widest uppercase">{t("delivery_info")}</p>
            {f("name", t("name"), "Your full name")}
            {f("street", t("street"), "123 Main Street", false)}
            <div className="grid grid-cols-2 gap-3">
              {f("country", t("country"), "UAE")}
              {f("city", t("city"), "Dubai")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {f("district", t("district"), "Al Barsha")}
              {f("zipCode", t("zip"), "000000", false)}
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full rounded-none bg-[#25D366] hover:bg-[#20b858] text-white text-xs tracking-widest uppercase font-semibold py-5"
            >
              {t("whatsapp_cta")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
