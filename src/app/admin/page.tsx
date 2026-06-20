import Link from "next/link";
import { Package, Plus, TrendingUp } from "lucide-react";
import { getProducts } from "@/lib/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default async function AdminDashboard() {
  const products = await getProducts();
  const recent = products.slice(0, 5);
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Card className="rounded-none border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] tracking-widest uppercase text-gray-400 font-normal flex items-center gap-2">
              <Package size={12} />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl text-jorrey-black">
              {products.length}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] tracking-widest uppercase text-gray-400 font-normal flex items-center gap-2">
              <TrendingUp size={12} />
              Catalogue Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-3xl text-jorrey-black">
              ${totalValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-gray-100 shadow-none bg-jorrey-black text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] tracking-widests uppercase text-white/40 font-normal flex items-center gap-2">
              <Plus size={12} />
              Quick Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/products/new"
              className="text-jorrey-gold text-sm tracking-wide hover:underline"
            >
              Add new product →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700 tracking-widest uppercase text-[11px]">
            Recent Products
          </h2>
          <Link
            href="/admin/products"
            className="text-xs text-jorrey-gold hover:underline tracking-wide"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-sm py-16 text-center">
            <p className="text-gray-400 text-sm">No products yet.</p>
            <Link
              href="/admin/products/new"
              className="text-jorrey-gold text-xs mt-2 inline-block hover:underline tracking-wide"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 bg-white border border-gray-100 px-4 py-3"
              >
                <div className="w-10 h-10 bg-jorrey-beige relative rounded-sm overflow-hidden flex-shrink-0">
                  {p.image && (
                    <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-400">{p.sku}</p>
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  ${p.price.toLocaleString()}
                </span>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="text-xs text-jorrey-gold hover:underline"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
