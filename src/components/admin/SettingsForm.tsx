"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SiteSettings, SocialLink, FooterSettings, FooterCompanyItem, FooterCompanyChild, FooterContactItem, SaleCountdown } from "@/lib/settings-types";
import type { CustomPage } from "@/lib/pages-types";

type MainFields = Omit<SiteSettings, "socialLinks" | "footer">;

type BgOption = { value: NonNullable<FooterSettings["bgColor"]>; label: string; preview: string };
const BG_OPTS: BgOption[] = [
  { value: "black", label: "Dark", preview: "bg-jorrey-black" },
  { value: "white", label: "White", preview: "bg-white border border-gray-200" },
  { value: "beige", label: "Beige", preview: "bg-jorrey-beige" },
];

function newLink(): SocialLink {
  return { id: Math.random().toString(36).slice(2), label: "", url: "" };
}

export default function SettingsForm({
  settings,
  availablePages = [],
}: {
  settings: SiteSettings;
  availablePages?: CustomPage[];
}) {
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(settings.socialLinks ?? []);
  const [footer, setFooter] = useState<FooterSettings>(settings.footer ?? {});
  const [collectionsTitle, setCollectionsTitle] = useState(settings.collectionsTitle ?? "");
  const [collectionsTitleAr, setCollectionsTitleAr] = useState(settings.collectionsTitleAr ?? "");
  const [collectionsDescription, setCollectionsDescription] = useState(settings.collectionsDescription ?? "");
  const [collectionsDescriptionAr, setCollectionsDescriptionAr] = useState(settings.collectionsDescriptionAr ?? "");

  // Sale countdown state
  const defaultCountdown: SaleCountdown = { enabled: false, endsAt: "", onExpiry: "hide" };
  const stored = settings.saleCountdown ?? defaultCountdown;
  const [countdown, setCountdown] = useState<SaleCountdown>(stored);
  // datetime-local value in local timezone (for the <input> only)
  const [countdownLocalDt, setCountdownLocalDt] = useState<string>(() => {
    if (!stored.endsAt) return "";
    try {
      // Convert UTC ISO → local datetime-local string "YYYY-MM-DDTHH:mm"
      return new Date(stored.endsAt).toLocaleString("sv").slice(0, 16).replace(" ", "T");
    } catch { return ""; }
  });
  function setCD(patch: Partial<SaleCountdown>) { setCountdown((p) => ({ ...p, ...patch })); }
  function handleCountdownDtChange(val: string) {
    setCountdownLocalDt(val);
    if (val) {
      setCD({ endsAt: new Date(val).toISOString() });
    } else {
      setCD({ endsAt: "" });
    }
  }

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<MainFields>({
    defaultValues: {
      whatsappNumber: settings.whatsappNumber,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      siteName: settings.siteName,
    },
  });

  const [companyItemErrors, setCompanyItemErrors] = useState<Record<string, string>>({});

  async function onSubmit(data: MainFields) {
    setErr(""); setSaved(false);

    // Validate: every visible company item (and child) must link to a page
    const errs: Record<string, string> = {};
    (footer.companyItems ?? []).forEach((item) => {
      if (item.visible && !item.pageId) errs[item.id] = "Select a target page";
      (item.children ?? []).forEach((child) => {
        if (child.visible && !child.pageId) errs[`${item.id}:${child.id}`] = "Select a target page";
      });
    });
    if (Object.keys(errs).length > 0) {
      setCompanyItemErrors(errs);
      setErr("Some Company items are missing a page link. Select a page for each visible item.");
      return;
    }
    setCompanyItemErrors({});

    const payload: SiteSettings = {
      ...data,
      socialLinks,
      footer,
      collectionsTitle: collectionsTitle || undefined,
      collectionsTitleAr: collectionsTitleAr || undefined,
      collectionsDescription: collectionsDescription || undefined,
      collectionsDescriptionAr: collectionsDescriptionAr || undefined,
      saleCountdown: countdown,
    };
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { setErr("Failed to save settings"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Social link helpers
  function addSocialLink() { setSocialLinks((p) => [...p, newLink()]); }
  function removeSocialLink(id: string) { setSocialLinks((p) => p.filter((l) => l.id !== id)); }
  function updateSocialLink(id: string, field: keyof SocialLink, value: string | boolean) {
    setSocialLinks((p) => p.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }
  function moveSocialLink(id: string, dir: -1 | 1) {
    setSocialLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  // Footer field helper
  function setF(patch: Partial<FooterSettings>) {
    setFooter((prev) => ({ ...prev, ...patch }));
  }

  // ── Company items helpers ──────────────────────────────────────────────────
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function companyItems(): FooterCompanyItem[] {
    return [...(footer.companyItems ?? [])].sort((a, b) => a.order - b.order);
  }

  function sortedChildren(parentId: string): FooterCompanyChild[] {
    const parent = (footer.companyItems ?? []).find((x) => x.id === parentId);
    return [...(parent?.children ?? [])].sort((a, b) => a.order - b.order);
  }

  function newId() { return Math.random().toString(36).slice(2, 10); }

  function addCompanyItem() {
    const item: FooterCompanyItem = {
      id: newId(), label: "", labelAr: "", url: "#", pageId: undefined,
      visible: true, order: (footer.companyItems ?? []).length, children: [],
    };
    setF({ companyItems: [...(footer.companyItems ?? []), item] });
  }

  function updateCompanyItem(id: string, patch: Partial<Omit<FooterCompanyItem, "id">>) {
    setF({
      companyItems: (footer.companyItems ?? []).map((x) => x.id === id ? { ...x, ...patch } : x),
    });
  }

  function removeCompanyItem(id: string) {
    setF({ companyItems: (footer.companyItems ?? []).filter((x) => x.id !== id) });
  }

  function moveCompanyItem(id: string, dir: -1 | 1) {
    const items = companyItems();
    const idx = items.findIndex((x) => x.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    items.forEach((x, i) => { x.order = i; });
    setF({ companyItems: items });
  }

  function addCompanyChild(parentId: string) {
    const parent = (footer.companyItems ?? []).find((x) => x.id === parentId);
    if (!parent) return;
    const child: FooterCompanyChild = {
      id: newId(), label: "", labelAr: "", url: "#", pageId: undefined,
      visible: true, order: parent.children.length,
    };
    updateCompanyItem(parentId, { children: [...parent.children, child] });
    setExpandedItems((prev) => new Set([...prev, parentId]));
  }

  function updateCompanyChild(parentId: string, childId: string, patch: Partial<Omit<FooterCompanyChild, "id">>) {
    const parent = (footer.companyItems ?? []).find((x) => x.id === parentId);
    if (!parent) return;
    updateCompanyItem(parentId, {
      children: parent.children.map((c) => c.id === childId ? { ...c, ...patch } : c),
    });
  }

  function removeCompanyChild(parentId: string, childId: string) {
    const parent = (footer.companyItems ?? []).find((x) => x.id === parentId);
    if (!parent) return;
    updateCompanyItem(parentId, { children: parent.children.filter((c) => c.id !== childId) });
  }

  function moveCompanyChild(parentId: string, childId: string, dir: -1 | 1) {
    const children = sortedChildren(parentId);
    const idx = children.findIndex((c) => c.id === childId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= children.length) return;
    [children[idx], children[swapIdx]] = [children[swapIdx], children[idx]];
    children.forEach((c, i) => { c.order = i; });
    updateCompanyItem(parentId, { children });
  }

  // ── Contact items helpers ─────────────────────────────────────────────────
  function contactItems(): FooterContactItem[] {
    return [...(footer.contactItems ?? [])].sort((a, b) => a.order - b.order);
  }

  function addContactItem() {
    const item: FooterContactItem = {
      id: newId(), label: "", labelAr: "", value: "", valueAr: "", url: "",
      visible: true, order: (footer.contactItems ?? []).length,
    };
    setF({ contactItems: [...(footer.contactItems ?? []), item] });
  }

  function updateContactItem(id: string, patch: Partial<Omit<FooterContactItem, "id">>) {
    setF({ contactItems: (footer.contactItems ?? []).map((x) => x.id === id ? { ...x, ...patch } : x) });
  }

  function removeContactItem(id: string) {
    setF({ contactItems: (footer.contactItems ?? []).filter((x) => x.id !== id) });
  }

  function moveContactItem(id: string, dir: -1 | 1) {
    const items = contactItems();
    const idx = items.findIndex((x) => x.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    items.forEach((x, i) => { x.order = i; });
    setF({ contactItems: items });
  }

  const activeBg = footer.bgColor ?? "black";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-xl">

      {/* WhatsApp */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">WhatsApp Integration</h2>
          <p className="text-xs text-gray-400 mt-1">Customers will be redirected here to complete their order.</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">WhatsApp Number</Label>
          <Input {...register("whatsappNumber")} placeholder="+971501234567" className="rounded-none font-mono" />
          <p className="text-xs text-gray-400">Include country code, e.g. +971501234567 for UAE.</p>
        </div>
      </div>

      {/* Currency */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Currency</h2>
          <p className="text-xs text-gray-400 mt-1">Displayed in the storefront and WhatsApp messages.</p>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs tracking-widests uppercase text-gray-500">Code</Label>
            <Input {...register("currency")} placeholder="USD" className="rounded-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs tracking-widests uppercase text-gray-500">Symbol</Label>
            <Input {...register("currencySymbol")} placeholder="$" className="rounded-none" />
          </div>
        </div>
      </div>

      {/* Header navigation note */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Header Navigation</h2>
          <p className="text-xs text-gray-400 mt-1">The header automatically shows your visible categories as navigation links.</p>
        </div>
        <Separator />
        <div className="bg-jorrey-beige/30 border border-jorrey-beige px-4 py-3 text-xs text-gray-500 leading-relaxed flex items-center justify-between gap-4">
          <span>Visible categories appear in the navigation automatically. Toggle visibility from Categories.</span>
          <Link href="/admin/categories" className="text-jorrey-gold hover:underline font-medium whitespace-nowrap flex items-center gap-1">
            <ExternalLink size={11} />
            Categories
          </Link>
        </div>
      </div>

      {/* ── Homepage — Collections section ─────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Homepage — Collections Section</h2>
          <p className="text-xs text-gray-400 mt-1">Title and description shown on the left side of the Collections block.</p>
        </div>
        <Separator />
        <div className="space-y-3">
          <div>
            <Label className="text-xs tracking-widests uppercase text-gray-500">Section Title (EN / AR)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Input
                value={collectionsTitle}
                onChange={(e) => setCollectionsTitle(e.target.value)}
                placeholder="The Collections"
                className="rounded-none"
              />
              <Input
                value={collectionsTitleAr}
                onChange={(e) => setCollectionsTitleAr(e.target.value)}
                placeholder="المجموعات"
                dir="rtl"
                className="rounded-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Leave blank to use the default translation.</p>
          </div>
          <div>
            <Label className="text-xs tracking-widests uppercase text-gray-500">Description (EN / AR)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Input
                value={collectionsDescription}
                onChange={(e) => setCollectionsDescription(e.target.value)}
                placeholder="Curated luxury pieces…"
                className="rounded-none"
              />
              <Input
                value={collectionsDescriptionAr}
                onChange={(e) => setCollectionsDescriptionAr(e.target.value)}
                placeholder="قطع فاخرة مختارة…"
                dir="rtl"
                className="rounded-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sale Countdown ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">On Sale Page — Countdown Timer</h2>
          <p className="text-xs text-gray-400 mt-1">
            Displays a live countdown on the On Sale page. End time is stored in UTC and
            the same countdown is shown to all visitors regardless of their timezone.
          </p>
        </div>
        <Separator />

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700">Enable countdown</p>
            <p className="text-xs text-gray-400 mt-0.5">When off the timer is hidden with no leftover space.</p>
          </div>
          <button
            type="button"
            onClick={() => setCD({ enabled: !countdown.enabled })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              countdown.enabled ? "bg-jorrey-black" : "bg-gray-200"
            }`}
            aria-pressed={countdown.enabled}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                countdown.enabled ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>

        {/* End date/time */}
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">Sale End Date &amp; Time (your local time)</Label>
          <input
            type="datetime-local"
            value={countdownLocalDt}
            onChange={(e) => handleCountdownDtChange(e.target.value)}
            className="w-full border border-gray-200 bg-white px-3 py-2 text-sm text-jorrey-black rounded-none focus:outline-none focus:border-jorrey-gold font-mono"
          />
          {countdown.endsAt && (
            <p className="text-xs text-gray-400">
              Stored as UTC: <span className="font-mono">{countdown.endsAt}</span>
            </p>
          )}
        </div>

        {/* Custom heading */}
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">Timer Heading (EN / AR) — optional</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={countdown.labelEn ?? ""}
              onChange={(e) => setCD({ labelEn: e.target.value || undefined })}
              placeholder="Sale ends in"
              className="rounded-none"
            />
            <Input
              value={countdown.labelAr ?? ""}
              onChange={(e) => setCD({ labelAr: e.target.value || undefined })}
              placeholder="ينتهي العرض خلال"
              dir="rtl"
              className="rounded-none"
            />
          </div>
          <p className="text-xs text-gray-400">Leave blank to use the default label.</p>
        </div>

        {/* On-expiry behaviour */}
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">When the timer reaches zero</Label>
          <div className="flex gap-2">
            {(["hide", "show_ended"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setCD({ onExpiry: opt })}
                className={`flex-1 py-2 px-3 text-xs tracking-widest uppercase border transition-colors ${
                  countdown.onExpiry === opt
                    ? "bg-jorrey-black text-white border-jorrey-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {opt === "hide" ? "Hide timer" : "Show 'Offer Ended'"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer branding ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Footer — Branding &amp; Style</h2>
          <p className="text-xs text-gray-400 mt-1">Customize the footer background, tagline, and column headings.</p>
        </div>
        <Separator />

        {/* Background color */}
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">Background</Label>
          <div className="flex gap-2">
            {BG_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setF({ bgColor: opt.value })}
                className={`flex items-center gap-2 flex-1 py-2 px-3 text-xs tracking-widest uppercase border transition-colors ${
                  activeBg === opt.value
                    ? "bg-jorrey-black text-white border-jorrey-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.preview}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label className="text-xs tracking-widests uppercase text-gray-500">Tagline</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={footer.tagline ?? ""}
              onChange={(e) => setF({ tagline: e.target.value || undefined })}
              placeholder="Luxury fashion crafted…"
              className="rounded-none"
            />
            <Input
              value={footer.taglineAr ?? ""}
              onChange={(e) => setF({ taglineAr: e.target.value || undefined })}
              placeholder="أزياء فاخرة…"
              dir="rtl"
              className="rounded-none"
            />
          </div>
          <p className="text-xs text-gray-400">Leave blank to use the default text.</p>
        </div>

        {/* Section column headings */}
        <div className="space-y-3">
          <Label className="text-xs tracking-widests uppercase text-gray-500">Column Headings (EN / AR)</Label>
          {[
            { enKey: "shopLabel" as const, arKey: "shopLabelAr" as const, def: "Shop" },
            { enKey: "companyLabel" as const, arKey: "companyLabelAr" as const, def: "Company" },
            { enKey: "connectLabel" as const, arKey: "connectLabelAr" as const, def: "Connect" },
            { enKey: "contactLabel" as const, arKey: "contactLabelAr" as const, def: "Contact Us" },
          ].map(({ enKey, arKey, def }) => (
            <div key={enKey} className="grid grid-cols-[72px_1fr_1fr] gap-2 items-center">
              <span className="text-xs text-gray-400 font-medium">{def}</span>
              <Input
                value={footer[enKey] ?? ""}
                onChange={(e) => setF({ [enKey]: e.target.value || undefined })}
                placeholder={def}
                className="rounded-none"
              />
              <Input
                value={footer[arKey] ?? ""}
                onChange={(e) => setF({ [arKey]: e.target.value || undefined })}
                placeholder={`(AR) ${def}`}
                dir="rtl"
                className="rounded-none"
              />
            </div>
          ))}
          <p className="text-xs text-gray-400">Leave blank to use the default translations.</p>
        </div>
      </div>

      {/* ── Footer connect links ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Footer — Connect Links</h2>
          <p className="text-xs text-gray-400 mt-1">Social media and contact links in the "Connect" column. Use arrows to reorder; eye icon to hide.</p>
        </div>
        <Separator />
        <div className="space-y-2">
          {socialLinks.map((link, i) => (
            <div key={link.id} className={`flex items-center gap-2 ${link.hidden ? "opacity-40" : ""}`}>
              {/* Order controls */}
              <div className="flex flex-col">
                <button type="button" onClick={() => moveSocialLink(link.id, -1)} disabled={i === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20" aria-label="Move up">
                  <ChevronUp size={12} />
                </button>
                <button type="button" onClick={() => moveSocialLink(link.id, 1)} disabled={i === socialLinks.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20" aria-label="Move down">
                  <ChevronDown size={12} />
                </button>
              </div>
              {/* Visibility toggle */}
              <button type="button" onClick={() => updateSocialLink(link.id, "hidden", !link.hidden)}
                className={`flex-shrink-0 transition-colors ${link.hidden ? "text-gray-300 hover:text-gray-500" : "text-jorrey-gold hover:text-gray-500"}`}
                aria-label={link.hidden ? "Show" : "Hide"}>
                {link.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <Input
                value={link.label}
                onChange={(e) => updateSocialLink(link.id, "label", e.target.value)}
                placeholder="Instagram"
                className="rounded-none w-28 flex-shrink-0"
              />
              <Input
                value={link.url}
                onChange={(e) => updateSocialLink(link.id, "url", e.target.value)}
                placeholder="https://instagram.com/jorrey"
                className="rounded-none flex-1 font-mono text-xs"
              />
              <button type="button" onClick={() => removeSocialLink(link.id)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" aria-label="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSocialLink}
            className="rounded-none text-xs tracking-widest uppercase border-dashed">
            <Plus size={13} className="me-1" />
            Add Social Link
          </Button>
        </div>
      </div>

      {/* ── Footer — Contact Us items ──────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Footer — Contact Us Section</h2>
          <p className="text-xs text-gray-400 mt-1">
            Shown as a &ldquo;Contact Us&rdquo; column in the footer (after the social links).
            Each item has a label (e.g. &ldquo;Email&rdquo;) and a value (e.g. &ldquo;hello@jorrey.com&rdquo;).
            Add an optional URL to make it clickable.
          </p>
        </div>
        <Separator />
        <div className="space-y-2">
          {contactItems().map((item, i) => (
            <div key={item.id} className={`border bg-white border-gray-100 space-y-2 p-3 ${!item.visible ? "opacity-60" : ""}`}>
              {/* Row: order + visibility + delete */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveContactItem(item.id, -1)} disabled={i === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp size={12} /></button>
                  <button type="button" onClick={() => moveContactItem(item.id, 1)} disabled={i === contactItems().length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown size={12} /></button>
                </div>
                <button type="button" onClick={() => updateContactItem(item.id, { visible: !item.visible })}
                  className={`flex-shrink-0 transition-colors ${item.visible ? "text-jorrey-gold hover:text-gray-400" : "text-gray-300 hover:text-gray-600"}`}>
                  {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => updateContactItem(item.id, { label: e.target.value })}
                    placeholder="Label (EN) — e.g. Email"
                    className="rounded-none h-8 text-xs"
                  />
                  <Input
                    value={item.labelAr ?? ""}
                    onChange={(e) => updateContactItem(item.id, { labelAr: e.target.value })}
                    placeholder="التسمية (AR)"
                    dir="rtl"
                    className="rounded-none h-8 text-xs"
                  />
                </div>
                <button type="button" onClick={() => removeContactItem(item.id)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={item.value}
                  onChange={(e) => updateContactItem(item.id, { value: e.target.value })}
                  placeholder="Value (EN) — e.g. hello@jorrey.com"
                  className="rounded-none h-8 text-xs"
                />
                <Input
                  value={item.valueAr ?? ""}
                  onChange={(e) => updateContactItem(item.id, { valueAr: e.target.value })}
                  placeholder="القيمة (AR)"
                  dir="rtl"
                  className="rounded-none h-8 text-xs"
                />
              </div>
              <Input
                value={item.url ?? ""}
                onChange={(e) => updateContactItem(item.id, { url: e.target.value || undefined })}
                placeholder="URL (optional) — makes it a clickable link"
                className="rounded-none h-8 text-xs font-mono"
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addContactItem}
            className="rounded-none text-xs tracking-widest uppercase border-dashed">
            <Plus size={13} className="me-1" />
            Add Contact Item
          </Button>
        </div>
      </div>

      {/* ── Footer — Company items ──────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Footer — Company Section</h2>
          <p className="text-xs text-gray-400 mt-1">
            Links in the &ldquo;Company&rdquo; footer column. Each item must be bound to a page from your Pages library.
            Labels are auto-filled from the page title but can be overridden.
          </p>
        </div>
        <Separator />

        {availablePages.length === 0 && (
          <div className="border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-400 flex items-center justify-between gap-3">
            <span>No pages exist yet. Create pages first, then link them here.</span>
            <Link href="/admin/pages/new" target="_blank"
              className="text-jorrey-gold hover:underline font-medium whitespace-nowrap flex items-center gap-1">
              <ExternalLink size={11} /> New Page
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {companyItems().map((item, i) => {
            const children = sortedChildren(item.id);
            const isExpanded = expandedItems.has(item.id);
            const itemErr = companyItemErrors[item.id];
            const linkedPage = availablePages.find((p) => p.id === item.pageId);

            return (
              <div key={item.id} className={`border bg-white ${itemErr ? "border-red-300" : "border-gray-100"}`}>
                {/* ── Controls row ── */}
                <div className={`flex items-center gap-2 px-3 py-2 ${!item.visible ? "opacity-60" : ""}`}>
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button type="button" onClick={() => moveCompanyItem(item.id, -1)} disabled={i === 0}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp size={12} /></button>
                    <button type="button" onClick={() => moveCompanyItem(item.id, 1)} disabled={i === companyItems().length - 1}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown size={12} /></button>
                  </div>

                  {/* Page selector */}
                  <div className="flex-1 min-w-0">
                    <Select
                      value={item.pageId ?? ""}
                      onValueChange={(val) => {
                        if (val === "__new") { window.open("/admin/pages/new", "_blank"); return; }
                        const page = availablePages.find((p) => p.id === val);
                        if (!page) return;
                        updateCompanyItem(item.id, {
                          pageId: page.id,
                          url: `/${page.slug}`,
                          label: item.label || page.title,
                          labelAr: item.labelAr || (page.titleAr ?? ""),
                        });
                        setCompanyItemErrors((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
                      }}
                    >
                      <SelectTrigger className={`rounded-none h-8 text-xs w-full ${itemErr ? "border-red-400" : ""}`}>
                        <SelectValue placeholder="Select a page…">
                          {linkedPage
                            ? <span>{linkedPage.title} <span className="text-gray-400 font-mono">/{linkedPage.slug}</span></span>
                            : <span className="text-gray-400">Select a page…</span>}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availablePages.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                            <span className="ms-1.5 text-gray-400 font-mono text-[11px]">/{p.slug}</span>
                            {!p.visible && <span className="ms-1.5 text-gray-300 text-[10px]">(hidden)</span>}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new" className="text-jorrey-gold font-medium">
                          + Create new page…
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Visibility */}
                  <button type="button" onClick={() => updateCompanyItem(item.id, { visible: !item.visible })}
                    className={`flex-shrink-0 transition-colors ${item.visible ? "text-jorrey-gold hover:text-gray-400" : "text-gray-300 hover:text-gray-600"}`}>
                    {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  {/* Expand */}
                  <button type="button" onClick={() => toggleExpand(item.id)}
                    className="flex-shrink-0 flex items-center gap-0.5 text-gray-400 hover:text-jorrey-black transition-colors">
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {children.length > 0 && <span className="text-[9px] tabular-nums">{children.length}</span>}
                  </button>

                  {/* Delete */}
                  <button type="button" onClick={() => removeCompanyItem(item.id)}
                    className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>

                {/* Validation error */}
                {itemErr && (
                  <div className="flex items-center gap-1.5 px-3 pb-2 text-xs text-red-500">
                    <AlertCircle size={11} />
                    {itemErr}
                  </div>
                )}

                {/* ── Override labels (always visible) ── */}
                <div className="border-t border-gray-50 px-3 pb-2 pt-1.5 grid grid-cols-2 gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => updateCompanyItem(item.id, { label: e.target.value })}
                    placeholder="Label shown in footer (EN)"
                    className="rounded-none h-7 text-xs"
                  />
                  <Input
                    value={item.labelAr ?? ""}
                    onChange={(e) => updateCompanyItem(item.id, { labelAr: e.target.value })}
                    placeholder="التسمية (AR)"
                    dir="rtl"
                    className="rounded-none h-7 text-xs"
                  />
                </div>

                {/* ── Sub-items ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-3 pt-2 pb-3 space-y-2">
                    {children.map((child, ci) => {
                      const childErrKey = `${item.id}:${child.id}`;
                      const childErr = companyItemErrors[childErrKey];
                      const childLinkedPage = availablePages.find((p) => p.id === child.pageId);
                      return (
                        <div key={child.id} className={`border bg-white ${childErr ? "border-red-300" : "border-gray-100"}`}>
                          {/* Child controls row */}
                          <div className={`flex items-center gap-2 px-2 py-1.5 ${!child.visible ? "opacity-60" : ""}`}>
                            <div className="w-2 flex-shrink-0" />
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <button type="button" onClick={() => moveCompanyChild(item.id, child.id, -1)} disabled={ci === 0}
                                className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp size={11} /></button>
                              <button type="button" onClick={() => moveCompanyChild(item.id, child.id, 1)} disabled={ci === children.length - 1}
                                className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown size={11} /></button>
                            </div>
                            {/* Child page selector */}
                            <div className="flex-1 min-w-0">
                              <Select
                                value={child.pageId ?? ""}
                                onValueChange={(val) => {
                                  if (val === "__new") { window.open("/admin/pages/new", "_blank"); return; }
                                  const page = availablePages.find((p) => p.id === val);
                                  if (!page) return;
                                  updateCompanyChild(item.id, child.id, {
                                    pageId: page.id,
                                    url: `/${page.slug}`,
                                    label: child.label || page.title,
                                    labelAr: child.labelAr || (page.titleAr ?? ""),
                                  });
                                  setCompanyItemErrors((prev) => { const n = { ...prev }; delete n[childErrKey]; return n; });
                                }}
                              >
                                <SelectTrigger className={`rounded-none h-7 text-xs w-full ${childErr ? "border-red-400" : ""}`}>
                                  <SelectValue placeholder="Select a page…">
                                    {childLinkedPage
                                      ? <span>{childLinkedPage.title} <span className="text-gray-400 font-mono">/{childLinkedPage.slug}</span></span>
                                      : <span className="text-gray-400">Select a page…</span>}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {availablePages.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.title}
                                      <span className="ms-1.5 text-gray-400 font-mono text-[11px]">/{p.slug}</span>
                                      {!p.visible && <span className="ms-1.5 text-gray-300 text-[10px]">(hidden)</span>}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="__new" className="text-jorrey-gold font-medium">
                                    + Create new page…
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <button type="button" onClick={() => updateCompanyChild(item.id, child.id, { visible: !child.visible })}
                              className={`flex-shrink-0 transition-colors ${child.visible ? "text-jorrey-gold hover:text-gray-400" : "text-gray-300 hover:text-gray-600"}`}>
                              {child.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                            <div className="w-[18px] flex-shrink-0" />
                            <button type="button" onClick={() => removeCompanyChild(item.id, child.id)}
                              className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                          </div>
                          {childErr && (
                            <div className="flex items-center gap-1.5 px-3 pb-1.5 text-xs text-red-500">
                              <AlertCircle size={10} />{childErr}
                            </div>
                          )}
                          {/* Child override labels */}
                          <div className="border-t border-gray-50 px-3 pb-1.5 pt-1 grid grid-cols-2 gap-2">
                            <Input
                              value={child.label}
                              onChange={(e) => updateCompanyChild(item.id, child.id, { label: e.target.value })}
                              placeholder="Label (EN)"
                              className="rounded-none h-6 text-xs"
                            />
                            <Input
                              value={child.labelAr ?? ""}
                              onChange={(e) => updateCompanyChild(item.id, child.id, { labelAr: e.target.value })}
                              placeholder="التسمية (AR)"
                              dir="rtl"
                              className="rounded-none h-6 text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={() => addCompanyChild(item.id)}
                      className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase text-gray-400 hover:text-jorrey-gold transition-colors">
                      <Plus size={10} /> Add sub-item
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <Button type="button" variant="outline" onClick={addCompanyItem}
            className="rounded-none text-xs tracking-widest uppercase border-dashed w-full">
            <Plus size={13} className="me-1" />
            Add Company Item
          </Button>
        </div>
        <p className="text-xs text-gray-400">
          Pages are managed in{" "}
          <Link href="/admin/pages" className="text-jorrey-gold hover:underline">Pages</Link>.
          Changes here are saved when you click &ldquo;Save Settings&rdquo;.
        </p>
      </div>

      {/* ── Footer shop categories note ─────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-jorrey-black">Footer — Shop Categories</h2>
          <p className="text-xs text-gray-400 mt-1">Appears in the "Shop" column — add, rename, or toggle categories.</p>
        </div>
        <Separator />
        <div className="bg-jorrey-beige/30 border border-jorrey-beige px-4 py-3 text-xs text-gray-500 leading-relaxed flex items-center justify-between gap-4">
          <span>Visible categories automatically appear in the footer. Manage them from the Categories section.</span>
          <Link href="/admin/categories" className="text-jorrey-gold hover:underline font-medium whitespace-nowrap flex items-center gap-1">
            <ExternalLink size={11} />
            Go to Categories
          </Link>
        </div>
      </div>

      {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2">{err}</p>}
      {saved && <p className="text-sm text-green-600 bg-green-50 px-3 py-2">Settings saved.</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase px-10"
      >
        {isSubmitting ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}
