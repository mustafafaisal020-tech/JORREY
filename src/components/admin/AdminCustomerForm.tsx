"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CustomerProfile } from "@/lib/customer-types";

export default function AdminCustomerForm({ customer }: { customer: CustomerProfile }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [street, setStreet] = useState(customer.address?.street ?? "");
  const [city, setCity] = useState(customer.address?.city ?? "");
  const [district, setDistrict] = useState(customer.address?.district ?? "");
  const [country, setCountry] = useState(customer.address?.country ?? "");
  const [zipCode, setZipCode] = useState(customer.address?.zipCode ?? "");

  async function save() {
    setSaving(true); setErr(""); setSaved(false);
    const payload = {
      email: customer.email,
      firstName,
      lastName: lastName || undefined,
      phone: phone || undefined,
      address: {
        street: street || undefined,
        city: city || undefined,
        district: district || undefined,
        country: country || undefined,
        zipCode: zipCode || undefined,
      },
    };
    const res = await fetch(`/api/customers/${customer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { setErr("Failed to save."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = "") => (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-widests uppercase text-gray-500">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-none" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-xl">
      {/* Clerk ID (read-only) */}
      <div className="bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-400 font-mono">
        Clerk ID: {customer.id}
        <span className="ms-4">Email: {customer.email}</span>
      </div>

      {/* Personal info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-jorrey-black">Personal Info</h2>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          {field("First Name", firstName, setFirstName, "First")}
          {field("Last Name", lastName, setLastName, "Last")}
        </div>
        {field("Phone", phone, setPhone, "+971 50 000 0000")}
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-jorrey-black">Delivery Address</h2>
        <Separator />
        {field("Street Address", street, setStreet, "123 Main Street")}
        <div className="grid grid-cols-2 gap-4">
          {field("Country", country, setCountry, "UAE")}
          {field("City", city, setCity, "Dubai")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("District", district, setDistrict, "Al Barsha")}
          {field("ZIP Code", zipCode, setZipCode, "00000")}
        </div>
      </div>

      {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2">{err}</p>}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={save}
          disabled={saving}
          className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase px-8"
        >
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/customers")}
          className="rounded-none text-xs tracking-widest uppercase"
        >
          Back
        </Button>
      </div>
    </div>
  );
}
