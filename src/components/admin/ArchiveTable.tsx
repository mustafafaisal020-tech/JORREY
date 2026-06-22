"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RotateCcw, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/product-types";

interface ArchiveTableProps {
  products: Product[];
}

export default function ArchiveTable({ products }: ArchiveTableProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [restoring, setRestoring] = useState<string | null>(null);

  async function handleRestore(id: string) {
    setRestoring(id);
    try {
      const res = await fetch(`/api/products/${id}/restore`, { method: "POST" });
      if (res.ok) {
        startTransition(() => router.refresh());
      }
    } finally {
      setRestoring(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="border border-gray-100 rounded-sm py-20 text-center">
        <Package size={32} className="mx-auto mb-3 text-gray-200" />
        <p className="text-gray-400 text-sm">No archived products.</p>
        <p className="text-xs text-gray-300 mt-1">
          Products you remove from the store will appear here and can be restored.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-[11px] tracking-widest uppercase text-gray-400 font-medium w-16">
              Image
            </TableHead>
            <TableHead className="text-[11px] tracking-widests uppercase text-gray-400 font-medium">
              Product
            </TableHead>
            <TableHead className="text-[11px] tracking-widests uppercase text-gray-400 font-medium">
              Category
            </TableHead>
            <TableHead className="text-[11px] tracking-widests uppercase text-gray-400 font-medium">
              Price
            </TableHead>
            <TableHead className="text-[11px] tracking-widests uppercase text-gray-400 font-medium">
              Archived
            </TableHead>
            <TableHead className="text-[11px] tracking-widests uppercase text-gray-400 font-medium w-28">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50/50 opacity-70">
              <TableCell>
                <div className="w-12 h-12 bg-gray-100 overflow-hidden rounded-sm relative grayscale">
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
                <p className="font-medium text-sm text-gray-500">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="text-[10px] tracking-widests uppercase font-normal bg-gray-100 text-gray-400 rounded-none"
                >
                  {product.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-400">
                ${product.price.toLocaleString()}
              </TableCell>
              <TableCell className="text-xs text-gray-400">
                {product.archivedAt
                  ? new Date(product.archivedAt).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(product.id)}
                  disabled={restoring === product.id}
                  className="rounded-none text-[10px] tracking-widests uppercase h-8 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
                >
                  <RotateCcw size={11} className="me-1" />
                  {restoring === product.id ? "Restoring…" : "Restore"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-gray-400 p-4">
        {products.length} archived product{products.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
