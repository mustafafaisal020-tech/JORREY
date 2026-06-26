"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";
import type { CartItem } from "./CartProvider";
import type { CustomerProfile } from "@/lib/customer-types";

interface DeliveryForm {
  name: string;
  phone: string;
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

function profileToForm(profile: CustomerProfile | null): Partial<DeliveryForm> {
  if (!profile) return {};
  return {
    name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    phone: profile.whatsappNumber ?? profile.phone ?? "",
    street: profile.address?.street ?? "",
    city: profile.address?.city ?? "",
    district: profile.address?.district ?? "",
    country: profile.address?.country ?? "",
    zipCode: profile.address?.zipCode ?? "",
  };
}

function isAddressComplete(f: DeliveryForm): boolean {
  return !!(f.name && f.country && f.city && f.district && f.phone);
}

function isValidPhone(p: string): boolean {
  const digits = p.replace(/\D/g, "");
  return digits.length >= 7;
}

export default function CheckoutModal({
  open,
  onClose,
  items,
  whatsappNumber: _whatsappNumber,
  currencySymbol,
}: CheckoutModalProps) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { user, isLoaded } = useUser();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DeliveryForm>({
    name: "", phone: "", street: "", country: "", city: "", district: "", zipCode: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPlacedOrderId(null);
      setSubmitError("");
      return;
    }
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
          phone: prefill.phone ?? "",
          street: prefill.street ?? "",
          country: prefill.country ?? "",
          city: prefill.city ?? "",
          district: prefill.district ?? "",
          zipCode: prefill.zipCode ?? "",
        };
        setForm(filled);
        setEditing(!isAddressComplete(filled));
      })
      .catch(() => { setProfile(null); setEditing(true); });
  }, [open, user, isLoaded]);

  function validate(): boolean {
    const e: Partial<Record<keyof DeliveryForm, string>> = {};
    if (!form.name.trim()) e.name = t("name") + " " + (isRTL ? "مطلوب" : "required");
    if (!form.phone.trim()) e.phone = t("phone_required");
    else if (!isValidPhone(form.phone)) e.phone = t("phone_invalid");
    if (!form.country.trim()) e.country = isRTL ? "مطلوب" : "Required";
    if (!form.city.trim()) e.city = isRTL ? "مطلوب" : "Required";
    if (!form.district.trim()) e.district = isRTL ? "مطلوب" : "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmitOrder() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const payload = {
      customerId: user?.id ?? null,
      customerEmail: user?.primaryEmailAddress?.emailAddress,
      customerPhone: form.phone,
      customerWhatsapp: form.phone,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        nameAr: i.nameAr,
        sku: i.sku,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
        unitPrice: i.price,
        image: i.image,
        category: i.category,
      })),
      address: {
        name: form.name,
        street: form.street || undefined,
        district: form.district || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        zipCode: form.zipCode || undefined,
      },
      subtotal,
      shipping: 0,
      discount: 0,
      total: subtotal,
      currencySymbol,
      locale,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      const order = await res.json();
      setPlacedOrderId(order.id);
    } catch {
      setSubmitError(t("order_error"));
    } finally {
      setSubmitting(false);
    }
  }

  const field = (key: keyof DeliveryForm, label: string, placeholder: string, required = true, type = "text") => (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-widest uppercase text-gray-500">
        {label}{required && " *"}
      </Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="rounded-none"
        dir={key === "phone" ? "ltr" : undefined}
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="rounded-none max-w-lg max-h-[90vh] overflow-y-auto bg-white"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{t("title")}</DialogTitle>
        </DialogHeader>

        {/* ── Success screen ── */}
        {placedOrderId ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
              <Check size={28} className="text-teal-600" />
            </div>
            <h2 className="font-serif text-xl text-jorrey-black">{t("order_success_title")}</h2>
            <p className="text-sm text-gray-500">{t("order_success_desc")}</p>
            <p className="text-[11px] text-gray-400 tracking-widest uppercase">
              {t("order_number")}: <span className="font-mono text-jorrey-black">{placedOrderId}</span>
            </p>
            <Button
              onClick={onClose}
              className="mt-4 rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase font-semibold py-4 px-8 transition-colors"
            >
              {t("continue_shopping")}
            </Button>
          </div>
        ) : (
          <>
            {/* Order summary */}
            <div className="bg-jorrey-beige/50 p-4 space-y-2 mb-2">
              {items.map((item) => (
                <div key={item.cartId} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {isRTL && item.nameAr ? item.nameAr : item.name}
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

            {/* Saved address preview (logged-in, complete address) */}
            {!editing && isAddressComplete(form) ? (
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
                  {form.phone && <p className="text-gray-500 text-xs" dir="ltr">{form.phone}</p>}
                  {form.street && <p className="text-gray-500">{form.street}</p>}
                  <p className="text-gray-500">
                    {[form.district, form.city, form.country].filter(Boolean).join(", ")}
                    {form.zipCode && ` ${form.zipCode}`}
                  </p>
                </div>
                {submitError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{submitError}</p>
                )}
                <Button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                >
                  {submitting ? t("submitting") : t("submit_order")}
                </Button>
              </div>
            ) : (
              /* Address + phone form */
              <div className="space-y-4">
                <p className="text-xs text-gray-400 tracking-widest uppercase">{t("delivery_info")}</p>
                {field("name", t("name"), isRTL ? "الاسم الكامل" : "Your full name")}
                {field("phone", t("phone"), "+964 7XX XXX XXXX", true, "tel")}
                {field("street", t("street"), isRTL ? "اسم الشارع" : "123 Main Street", false)}
                <div className="grid grid-cols-2 gap-3">
                  {field("country", t("country"), isRTL ? "الدولة" : "Iraq")}
                  {field("city", t("city"), isRTL ? "المدينة" : "Baghdad")}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {field("district", t("district"), isRTL ? "الحي" : "Al Mansour")}
                  {field("zipCode", t("zip"), "000000", false)}
                </div>
                {submitError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{submitError}</p>
                )}
                <Button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                >
                  {submitting ? t("submitting") : t("submit_order")}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
