"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Category } from "@/lib/category-types";

export default function CategoryTable({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [cats, setCats] = useState<Category[]>(initial);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function toggleVisible(cat: Category) {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !cat.visible }),
    });
    setCats((prev) => prev.map((c) => c.id === cat.id ? { ...c, visible: !c.visible } : c));
    start(() => router.refresh());
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = cats.findIndex((c) => c.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= cats.length) return;
    const next = [...cats];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setCats(next);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "reorder", ids: next.map((c) => c.id) }),
    });
    start(() => router.refresh());
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/categories/${toDelete.id}`, { method: "DELETE" });
    setCats((prev) => prev.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    setDeleting(false);
    start(() => router.refresh());
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Link href="/admin/categories/new">
          <Button className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase">
            + Add Category
          </Button>
        </Link>
      </div>
      <div className="border border-gray-100 rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 text-[11px] tracking-widest uppercase text-gray-400 font-medium">Order</TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">Name</TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">Arabic</TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">Slug</TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">Status</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : cats.map((cat, i) => (
              <TableRow key={cat.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(cat.id, -1)}
                      disabled={i === 0}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                      aria-label="Move up"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(cat.id, 1)}
                      disabled={i === cats.length - 1}
                      className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                      aria-label="Move down"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                <TableCell className="text-sm" dir="rtl">{cat.nameAr}</TableCell>
                <TableCell className="text-xs text-gray-400 font-mono">{cat.slug}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] tracking-widest uppercase rounded-none ${cat.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {cat.visible ? "Visible" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-jorrey-black"
                      onClick={() => toggleVisible(cat)}
                    >
                      {cat.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Link href={`/admin/categories/${cat.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-jorrey-black">
                        <Pencil size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => setToDelete(cat)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Delete Category</DialogTitle>
            <DialogDescription>
              Delete <strong>{toDelete?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} className="rounded-none text-xs tracking-widest uppercase">
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-none bg-red-600 text-white hover:bg-red-700 text-xs tracking-widest uppercase"
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
