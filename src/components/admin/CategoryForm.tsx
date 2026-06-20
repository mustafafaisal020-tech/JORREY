"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ImageUpload from "./ImageUpload";
import type { Category } from "@/lib/category-types";

const schema = z.object({
  name:            z.string().min(1, "Required"),
  nameAr:          z.string().min(1, "Required"),
  slug:            z.string().min(1, "Required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  visible:         z.boolean(),
  image:           z.string().optional(),
  description:     z.string().optional(),
  descriptionAr:   z.string().optional(),
  filtersEnabled:  z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const isEdit = !!category;

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? {
          name: category.name,
          nameAr: category.nameAr,
          slug: category.slug,
          visible: category.visible,
          image: category.image ?? "",
          description: category.description ?? "",
          descriptionAr: category.descriptionAr ?? "",
          filtersEnabled: category.filtersEnabled !== false,
        }
      : { name: "", nameAr: "", slug: "", visible: true, image: "", description: "", descriptionAr: "", filtersEnabled: true },
  });

  async function onSubmit(data: FormData) {
    setErr("");
    const payload = {
      ...data,
      description: data.description || undefined,
      descriptionAr: data.descriptionAr || undefined,
    };
    const url  = isEdit ? `/api/categories/${category.id}` : "/api/categories";
    const res  = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error ?? "Error"); return; }
    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {/* Names */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">Name (EN)</Label>
          <Input {...register("name")} placeholder="Outerwear" onBlur={(e) => {
            if (!isEdit) setValue("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
          }} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">الاسم (AR)</Label>
          <Input {...register("nameAr")} placeholder="الملابس الخارجية" dir="rtl" />
          {errors.nameAr && <p className="text-xs text-red-500">{errors.nameAr.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs tracking-widest uppercase text-gray-500">Slug</Label>
        <Input {...register("slug")} placeholder="outerwear" />
        {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
      </div>

      {/* Category image */}
      <div className="space-y-2">
        <Label className="text-xs tracking-widest uppercase text-gray-500">
          Category Image <span className="text-gray-300 normal-case tracking-normal font-normal">shown on homepage collection card</span>
        </Label>
        <div className="max-w-[200px]">
          <ImageUpload value={watch("image") ?? ""} onChange={(url) => setValue("image", url)} />
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-jorrey-black">Category Description</p>
          <p className="text-xs text-gray-400 mt-0.5">Optional. Shown at the top of the filter panel on the category page.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">Description (EN)</Label>
          <Textarea
            {...register("description")}
            placeholder="Discover our curated collection of…"
            rows={3}
            className="rounded-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest uppercase text-gray-500">الوصف (AR)</Label>
          <Textarea
            {...register("descriptionAr")}
            placeholder="اكتشفي مجموعتنا المنتقاة من…"
            rows={3}
            className="rounded-none"
            dir="rtl"
          />
        </div>
      </div>

      <Separator />

      {/* Visibility + Filters */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={watch("visible")} onCheckedChange={(v) => setValue("visible", !!v)} />
          <span className="text-sm text-gray-700">Visible on site</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            checked={watch("filtersEnabled")}
            onCheckedChange={(v) => setValue("filtersEnabled", !!v)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm text-gray-700">Enable filter panel</p>
            <p className="text-xs text-gray-400 mt-0.5">Show size, color, price, and category-specific filters on the public category page.</p>
          </div>
        </label>
      </div>

      {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2">{err}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-xs tracking-widest uppercase px-8">
          {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-none text-xs tracking-widest uppercase">Cancel</Button>
      </div>
    </form>
  );
}
