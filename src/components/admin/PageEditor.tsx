"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check, X, Save, Image as ImageIcon, CornerDownRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "./ImageUpload";
import type { HomeSection, CustomPage, CustomSection } from "@/lib/pages-types";

// ── Home page section manager ──────────────────────────────────────────────────
export function HomeSectionManager({ sections: initial }: { sections: HomeSection[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [sections, setSections] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editHeading, setEditHeading] = useState("");
  const [editHeadingAr, setEditHeadingAr] = useState("");
  const [editSubheading, setEditSubheading] = useState("");
  const [editSubheadingAr, setEditSubheadingAr] = useState("");

  async function post(body: object) {
    await fetch("/api/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    start(() => router.refresh());
  }

  async function toggleVisible(s: HomeSection) {
    const next = sections.map((x) => x.id === s.id ? { ...x, visible: !x.visible } : x);
    setSections(next);
    await post({ _action: "updateHomeSection", id: s.id, patch: { visible: !s.visible } });
  }

  async function move(id: string, dir: -1 | 1) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    sorted[idx].order = swap.order; swap.order = sorted[idx].order;
    [sorted[idx].order, swap.order] = [swap.order, sorted[idx].order];
    const reordered = [...sorted].sort((a, b) => a.order - b.order);
    setSections(reordered);
    await post({ _action: "reorderHome", ids: reordered.map((s) => s.id) });
  }

  async function saveEdit(id: string) {
    const patch = {
      name: editName,
      nameAr: editNameAr,
      image: editImage || undefined,
      heading: editHeading || undefined,
      headingAr: editHeadingAr || undefined,
      subheading: editSubheading || undefined,
      subheadingAr: editSubheadingAr || undefined,
    };
    const next = sections.map((s) => s.id === id ? { ...s, ...patch } : s);
    setSections(next);
    await post({ _action: "updateHomeSection", id, patch });
    setEditingId(null);
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2 max-w-2xl">
      {sorted.map((s, i) => (
        <div key={s.id} className={`flex items-center gap-3 bg-white border px-4 py-3 ${!s.visible ? "opacity-50" : ""}`}>
          <div className="flex flex-col gap-0.5">
            <button onClick={() => move(s.id, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp size={14} /></button>
            <button onClick={() => move(s.id, 1)} disabled={i === sorted.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown size={14} /></button>
          </div>
          {editingId === s.id ? (
            <div className="flex-1 space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Label (admin)</p>
                  <div className="flex gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-none text-sm h-8" placeholder="Section name" />
                    <Input value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} className="rounded-none text-sm h-8" placeholder="اسم القسم" dir="rtl" />
                  </div>
                </div>
                <button onClick={() => saveEdit(s.id)} className="text-green-600 hover:text-green-700 flex-shrink-0 mb-0.5"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mb-0.5"><X size={16} /></button>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Heading (shown on page)</p>
                <div className="flex gap-2">
                  <Input value={editHeading} onChange={(e) => setEditHeading(e.target.value)} className="rounded-none text-sm h-8" placeholder="Elegance Designed for You" />
                  <Input value={editHeadingAr} onChange={(e) => setEditHeadingAr(e.target.value)} className="rounded-none text-sm h-8" placeholder="أناقة لأجلك" dir="rtl" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Subheading / tagline</p>
                <div className="flex gap-2">
                  <Input value={editSubheading} onChange={(e) => setEditSubheading(e.target.value)} className="rounded-none text-sm h-8" placeholder="Curated luxury pieces…" />
                  <Input value={editSubheadingAr} onChange={(e) => setEditSubheadingAr(e.target.value)} className="rounded-none text-sm h-8" placeholder="قطع فاخرة…" dir="rtl" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 flex-shrink-0 flex items-center gap-1"><ImageIcon size={10} />Background image</p>
                <div className="w-32">
                  <ImageUpload value={editImage} onChange={setEditImage} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-3">
              {s.image && (
                <div className="w-10 h-10 relative rounded-sm overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image src={s.image} alt="" fill sizes="40px" className="object-cover" />
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-900">{s.name}</span>
                <span className="text-xs text-gray-400 ms-2" dir="rtl">{s.nameAr}</span>
              </div>
            </div>
          )}
          <Badge variant="secondary" className={`text-[10px] rounded-none ${s.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {s.visible ? "Visible" : "Hidden"}
          </Badge>
          <button onClick={() => { setEditingId(s.id); setEditName(s.name); setEditNameAr(s.nameAr); setEditImage(s.image ?? ""); setEditHeading(s.heading ?? ""); setEditHeadingAr(s.headingAr ?? ""); setEditSubheading(s.subheading ?? ""); setEditSubheadingAr(s.subheadingAr ?? ""); }} className="text-gray-400 hover:text-jorrey-black"><Pencil size={13} /></button>
          <button onClick={() => toggleVisible(s)} className="text-gray-400 hover:text-jorrey-black">
            {s.visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Custom pages list manager (for /admin/pages) ──────────────────────────────
export function CustomPagesManager({ pages: initial }: { pages: CustomPage[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  // Track all pages (root + children) in one state for optimistic updates
  const [pages, setPages] = useState(initial);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rootPages = pages
    .filter((p) => !p.parentId)
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  function childrenOf(parentId: string) {
    return pages
      .filter((p) => p.parentId === parentId)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  }

  async function post(body: object) {
    await fetch("/api/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    start(() => router.refresh());
  }

  async function moveRoot(id: string, dir: -1 | 1) {
    const sorted = [...rootPages];
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    const ids = sorted.map((p) => p.id);
    setPages((prev) => prev.map((p) => {
      const i = ids.indexOf(p.id);
      return i >= 0 ? { ...p, order: i } : p;
    }));
    await post({ _action: "reorderCustom", ids });
  }

  async function moveChild(id: string, parentId: string, dir: -1 | 1) {
    const siblings = [...childrenOf(parentId)];
    const idx = siblings.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    [siblings[idx], siblings[swapIdx]] = [siblings[swapIdx], siblings[idx]];
    const ids = siblings.map((p) => p.id);
    setPages((prev) => prev.map((p) => {
      const i = ids.indexOf(p.id);
      return i >= 0 ? { ...p, order: i } : p;
    }));
    await post({ _action: "reorderCustom", ids });
  }

  async function toggleVisible(page: CustomPage) {
    setPages((prev) => prev.map((p) => p.id === page.id ? { ...p, visible: !p.visible } : p));
    await fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !page.visible }),
    });
    start(() => router.refresh());
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/pages/${toDelete}`, { method: "DELETE" });
    // Remove deleted page + any children (server cascade-deletes them too)
    setPages((prev) => prev.filter((p) => p.id !== toDelete && p.parentId !== toDelete));
    setToDelete(null);
    setDeleting(false);
    start(() => router.refresh());
  }

  if (rootPages.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm max-w-2xl">
        No custom pages yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {rootPages.map((page, i) => {
        const children = childrenOf(page.id);
        return (
          <div key={page.id} className="space-y-1">
            {/* Root page row */}
            <div className={`flex items-center gap-3 bg-white border px-4 py-3 ${!page.visible ? "opacity-50" : ""}`}>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => moveRoot(page.id, -1)} disabled={i === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveRoot(page.id, 1)} disabled={i === rootPages.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{page.title}</p>
                <p className="text-xs text-gray-400">/{page.slug} · {page.sections.length} sections</p>
              </div>
              <Badge variant="secondary" className={`text-[10px] rounded-none flex-shrink-0 ${page.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {page.visible ? <><Eye size={10} className="inline me-1" />Visible</> : <><EyeOff size={10} className="inline me-1" />Hidden</>}
              </Badge>
              <button onClick={() => toggleVisible(page)} className="text-gray-400 hover:text-jorrey-black flex-shrink-0">
                {page.visible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <Link href={`/admin/pages/${page.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-jorrey-black flex-shrink-0">
                  <Pencil size={14} />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 flex-shrink-0"
                onClick={() => setToDelete(page.id)}>
                <Trash2 size={14} />
              </Button>
            </div>

            {/* Child pages — with full controls */}
            {children.map((child, ci) => (
              <div key={child.id} className={`flex items-center gap-3 ms-6 border-s-2 border-s-jorrey-beige bg-white border border-gray-100 px-4 py-3 ${!child.visible ? "opacity-50" : ""}`}>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveChild(child.id, page.id, -1)} disabled={ci === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                    <ChevronUp size={13} />
                  </button>
                  <button onClick={() => moveChild(child.id, page.id, 1)} disabled={ci === children.length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                    <ChevronDown size={13} />
                  </button>
                </div>
                <CornerDownRight size={13} className="text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{child.title}</p>
                  <p className="text-xs text-gray-400">/{child.slug}</p>
                </div>
                <Badge variant="secondary" className={`text-[10px] rounded-none flex-shrink-0 ${child.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {child.visible ? "Visible" : "Hidden"}
                </Badge>
                <button onClick={() => toggleVisible(child)} className="text-gray-400 hover:text-jorrey-black flex-shrink-0">
                  {child.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <Link href={`/admin/pages/${child.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-jorrey-black flex-shrink-0">
                    <Pencil size={14} />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 flex-shrink-0"
                  onClick={() => setToDelete(child.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}

            {/* Add subpage link */}
            <div className="ms-6 ps-4">
              <Link
                href={`/admin/pages/new?parentId=${page.id}`}
                className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-gray-400 hover:text-jorrey-gold transition-colors py-1"
              >
                <Plus size={10} />
                Add subpage under &ldquo;{page.title}&rdquo;
              </Link>
            </div>
          </div>
        );
      })}

      {/* Delete confirm — covers both root pages and children */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Delete Page</DialogTitle>
            <DialogDescription>
              This will permanently delete the page and all its sections.
              If this is a parent page, all its subpages will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} className="rounded-none text-xs tracking-widest uppercase">Cancel</Button>
            <Button onClick={confirmDelete} disabled={deleting}
              className="rounded-none bg-red-600 text-white hover:bg-red-700 text-xs tracking-widest uppercase">
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page metadata editor ───────────────────────────────────────────────────────
export function PageMetadataEditor({ page }: { page: CustomPage }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [form, setForm] = useState({ title: page.title, titleAr: page.titleAr ?? "", slug: page.slug, visible: page.visible });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/pages/${page.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, titleAr: form.titleAr, slug: form.slug, visible: form.visible }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    start(() => router.refresh());
  }

  return (
    <div className="max-w-2xl mb-10 space-y-4 bg-white border border-gray-100 p-5">
      <p className="text-[11px] tracking-widests uppercase text-gray-400 font-medium">Page Settings</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-widests text-gray-500">Title (EN)</Label>
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="rounded-none" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-widests text-gray-500">العنوان (AR)</Label>
          <Input value={form.titleAr} onChange={(e) => setForm((p) => ({ ...p, titleAr: e.target.value }))} dir="rtl" className="rounded-none" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-widests text-gray-500">Slug (URL)</Label>
        <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="rounded-none font-mono" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={form.visible} onCheckedChange={(v) => setForm((p) => ({ ...p, visible: !!v }))} />
        <span className="text-sm text-gray-700">Visible on site</span>
      </label>
      <Button
        onClick={save}
        disabled={saving}
        className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase"
      >
        <Save size={12} className="me-1.5" />
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
}

// ── Custom page section editor ─────────────────────────────────────────────────
export function CustomPageEditor({ page }: { page: CustomPage }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editSection, setEditSection] = useState<CustomSection | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newSection, setNewSection] = useState({ name: "", nameAr: "", type: "text" as CustomSection["type"], content: "", contentAr: "" });

  async function call(body: object) {
    await fetch(`/api/pages/${page.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    start(() => router.refresh());
  }

  async function addSection() {
    await call({ _action: "addSection", section: { ...newSection, visible: true, order: page.sections.length } });
    setAddOpen(false);
    setNewSection({ name: "", nameAr: "", type: "text", content: "", contentAr: "" });
  }

  async function saveEdit() {
    if (!editSection) return;
    await call({ _action: "updateSection", sectionId: editSection.id, patch: { name: editSection.name, nameAr: editSection.nameAr, content: editSection.content, contentAr: editSection.contentAr, visible: editSection.visible } });
    setEditSection(null);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await call({ _action: "deleteSection", sectionId: toDelete });
    setToDelete(null); setDeleting(false);
  }

  async function toggleSection(s: CustomSection) {
    await call({ _action: "updateSection", sectionId: s.id, patch: { visible: !s.visible } });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase">
          <Plus size={13} className="me-1" /> Add Section
        </Button>
      </div>

      {page.sections.length === 0 && (
        <div className="border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">No sections yet.</div>
      )}

      {[...page.sections].sort((a, b) => a.order - b.order).map((s) => (
        <div key={s.id} className={`bg-white border border-gray-100 p-4 space-y-2 ${!s.visible ? "opacity-50" : ""}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-gray-400" dir="rtl">{s.nameAr}</p>
              <Badge variant="secondary" className="text-[10px] rounded-none mt-1">{s.type}</Badge>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-jorrey-black" onClick={() => toggleSection(s)}>
                {s.visible ? <EyeOff size={13} /> : <Eye size={13} />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-jorrey-black" onClick={() => setEditSection({ ...s })}>
                <Pencil size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => setToDelete(s.id)}>
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
          {s.content && <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 px-3 py-1.5 rounded">{s.content}</p>}
        </div>
      ))}

      {/* Add section dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent showCloseButton={false} className="rounded-none max-w-lg bg-white">
          <DialogHeader><DialogTitle className="font-serif text-lg">Add Section</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">Name (EN)</Label><Input value={newSection.name} onChange={(e) => setNewSection((p) => ({ ...p, name: e.target.value }))} className="rounded-none" /></div>
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">الاسم (AR)</Label><Input value={newSection.nameAr} onChange={(e) => setNewSection((p) => ({ ...p, nameAr: e.target.value }))} className="rounded-none" dir="rtl" /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-gray-500">Type</Label>
              <Select value={newSection.type} onValueChange={(v) => setNewSection((p) => ({ ...p, type: v as CustomSection["type"] }))}>
                <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="heading">Heading</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="richtext">Rich Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">Content (EN)</Label><Textarea value={newSection.content} onChange={(e) => setNewSection((p) => ({ ...p, content: e.target.value }))} rows={3} className="rounded-none" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">المحتوى (AR)</Label><Textarea value={newSection.contentAr} onChange={(e) => setNewSection((p) => ({ ...p, contentAr: e.target.value }))} rows={3} className="rounded-none" dir="rtl" /></div>
          </div>
          <DialogFooter><Button onClick={addSection} className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase">Add Section</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit section dialog */}
      <Dialog open={!!editSection} onOpenChange={(o) => !o && setEditSection(null)}>
        <DialogContent showCloseButton={false} className="rounded-none max-w-lg bg-white">
          <DialogHeader><DialogTitle className="font-serif text-lg">Edit Section</DialogTitle></DialogHeader>
          {editSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">Name (EN)</Label><Input value={editSection.name} onChange={(e) => setEditSection((p) => p ? { ...p, name: e.target.value } : p)} className="rounded-none" /></div>
                <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">الاسم (AR)</Label><Input value={editSection.nameAr} onChange={(e) => setEditSection((p) => p ? { ...p, nameAr: e.target.value } : p)} className="rounded-none" dir="rtl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">Content (EN)</Label><Textarea value={editSection.content} onChange={(e) => setEditSection((p) => p ? { ...p, content: e.target.value } : p)} rows={4} className="rounded-none" /></div>
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-gray-500">المحتوى (AR)</Label><Textarea value={editSection.contentAr} onChange={(e) => setEditSection((p) => p ? { ...p, contentAr: e.target.value } : p)} rows={4} className="rounded-none" dir="rtl" /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveEdit} className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader><DialogTitle className="font-serif text-lg">Delete Section</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} className="rounded-none text-xs tracking-widest uppercase">Cancel</Button>
            <Button onClick={confirmDelete} disabled={deleting} className="rounded-none bg-red-600 text-white hover:bg-red-700 text-xs tracking-widest uppercase">{deleting ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
