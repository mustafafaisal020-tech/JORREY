import Link from "next/link";
import { getCustomers } from "@/lib/customers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Pencil, MapPin, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black flex items-center gap-3">
          <Users size={22} className="text-jorrey-gold" />
          Customers
        </h1>
        <p className="text-gray-400 text-sm mt-1">{customers.length} registered customer{customers.length !== 1 ? "s" : ""}</p>
      </div>

      {customers.length === 0 ? (
        <div className="border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No customers yet. They appear here after signing up or saving their profile.
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const addressParts = [c.address?.city, c.address?.country].filter(Boolean).join(", ");
            return (
              <div key={c.id} className="flex items-start gap-4 bg-white border border-gray-100 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-jorrey-black">
                      {c.firstName} {c.lastName ?? ""}
                    </p>
                    <span className="text-gray-400 text-xs">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {c.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone size={10} /> {c.phone}
                      </span>
                    )}
                    {addressParts && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={10} /> {addressParts}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] rounded-none ${c.address?.city ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    {c.address?.city ? "Has address" : "No address"}
                  </Badge>
                  <p className="text-[10px] text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  <Link href={`/admin/customers/${c.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-jorrey-black">
                      <Pencil size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
