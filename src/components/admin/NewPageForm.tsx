"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomPage, HomeSection } from "@/lib/pages-types";

interface Props {
  parentPages: CustomPage[];
  defaultParentId?: string;
  homeSections?: HomeSection[];
}

export default function NewPageForm({ parentPages, defaultParentId, homeSections = [] }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    titleAr: "",
    slug: "",
    visible: true,
    parentId: defaultParentId ?? "",
    homeSectionId: "",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.slug) { setErr("Title and slug are required"); return; }
    setSaving(true);
    const body = { ...form, parentId: form.parentId || undefined, homeSectionId: form.homeSectionId || undefined };
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { setErr("Failed to create page"); setSaving(false); return; }
    const page = await res.json();
    router.push(`/admin/pages/${page.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Title */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">Title (EN)</Label>
          <Input
            value={form.title}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                title: e.target.value,
                slug: p.slug || e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, ""),
              }))
            }
            placeholder="About Us"
            className="rounded-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">العنوان (AR)</Label>
          <Input
            value={form.titleAr}
            onChange={(e) => setForm((p) => ({ ...p, titleAr: e.target.value }))}
            placeholder="من نحن"
            dir="rtl"
            className="rounded-none"
          />
        </div>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label className="text-xs tracking-widests uppercase text-gray-500">Slug (URL path)</Label>
        <Input
          value={form.slug}
          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
          placeholder="about-us"
          className="rounded-none font-mono"
        />
      </div>

      {/* Parent page */}
      {parentPages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">
            Parent Page <span className="text-gray-300 normal-case tracking-normal font-normal">optional — creates a subpage</span>
          </Label>
          <Select
            value={form.parentId || "none"}
            onValueChange={(v) => setForm((p) => ({ ...p, parentId: !v || v === "none" ? "" : v }))}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="None (top-level page)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top-level page)</SelectItem>
              {parentPages.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Homepage section placement */}
      {homeSections.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">
            Homepage Placement <span className="text-gray-300 normal-case tracking-normal font-normal">optional — links this page from a homepage section</span>
          </Label>
          <Select
            value={form.homeSectionId || "none"}
            onValueChange={(v) => setForm((p) => ({ ...p, homeSectionId: !v || v === "none" ? "" : v }))}
          >
            <SelectTrigger className="rounded-none">
              <SelectValue placeholder="Footer only (default)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Footer only (default)</SelectItem>
              {homeSections.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-gray-400">The page will always appear in the footer under "Company". Optionally also link it from a homepage section.</p>
        </div>
      )}

      {/* Visible */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={form.visible}
          onCheckedChange={(v) => setForm((p) => ({ ...p, visible: !!v }))}
        />
        <span className="text-sm text-gray-700">Visible on site</span>
      </label>

      {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2">{err}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase px-8"
        >
          {saving ? "Creating…" : "Create Page"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-none text-xs tracking-widest uppercase"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
