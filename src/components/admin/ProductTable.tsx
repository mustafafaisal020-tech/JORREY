"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Trash2, Search, Filter, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Product } from "@/lib/product-types";

const STATUS_FLAGS = [
  { key: "New Arrival",     label: "New",      color: "text-teal-600",   bg: "bg-teal-50"   },
  { key: "Featured",        label: "Featured", color: "text-yellow-600", bg: "bg-yellow-50" },
  { key: "On Sale",         label: "Sale",     color: "text-red-600",    bg: "bg-red-50"    },
  { key: "Limited Edition", label: "Limited",  color: "text-amber-600",  bg: "bg-amber-50"  },
  { key: "Clearance",       label: "Clear",    color: "text-orange-600", bg: "bg-orange-50" },
] as const;

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products: initial }: ProductTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = initial.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);
    const matchCat = category === "all" || p.category === category;
    return matchSearch && matchCat;
  });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await fetch(`/api/products/${toDelete.id}`, { method: "DELETE" });
    setToDelete(null);
    setDeleting(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="pl-9 rounded-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
            <SelectTrigger className="w-40 rounded-none text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/admin/products/archive" className="text-xs text-gray-400 hover:text-jorrey-black transition-colors underline underline-offset-2">
          View Archive
        </Link>
        <Link href="/admin/products/new">
          <Button className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase">
            + Add Product
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="border border-gray-100 rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium w-16">
                Image
              </TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">
                Product
              </TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">
                Category
              </TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">
                Price
              </TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">
                Flags
              </TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium">
                Sizes
              </TableHead>
              <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                  {initial.length === 0
                    ? "No products yet. Add your first product."
                    : "No products match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="w-12 h-12 bg-gray-100 overflow-hidden rounded-sm relative">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-jorrey-beige" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm text-gray-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      SKU: {product.sku}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] tracking-widest uppercase font-normal bg-jorrey-beige text-gray-600 rounded-none"
                    >
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    <div>
                      {product.status?.includes("On Sale") && product.salePrice ? (
                        <>
                          <span className="text-red-600">${product.salePrice.toLocaleString()}</span>
                          <span className="text-gray-400 text-xs line-through ms-1.5">${product.price.toLocaleString()}</span>
                        </>
                      ) : (
                        `$${product.price.toLocaleString()}`
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.inStock === false && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 text-red-700 bg-red-100">
                          OOS
                        </span>
                      )}
                      {STATUS_FLAGS.map(({ key, label, color, bg }) =>
                        product.status?.includes(key) ? (
                          <span
                            key={key}
                            className={`inline-flex items-center gap-0.5 text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 ${color} ${bg}`}
                          >
                            <Check size={9} strokeWidth={3} />
                            {label}
                          </span>
                        ) : null
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.ml ? (
                        <span className="text-[10px] border border-gray-200 px-1.5 py-0.5 text-gray-500">
                          {product.ml} ML
                        </span>
                      ) : (
                        product.sizes.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] border border-gray-200 px-1.5 py-0.5 text-gray-500"
                          >
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-jorrey-black"
                        >
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => setToDelete(product)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Archive confirmation */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Remove Product
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              <strong>{toDelete?.name}</strong> will be removed from the store and
              moved to the archive. You can restore it at any time from{" "}
              <strong>Products → View Archive</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              className="rounded-none text-xs tracking-widest uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-none bg-red-600 text-white hover:bg-red-700 text-xs tracking-widest uppercase"
            >
              {deleting ? "Archiving…" : "Remove from Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
