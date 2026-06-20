"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Package, Tag, FileText, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview",   href: "/admin",            icon: LayoutDashboard },
  { label: "Products",   href: "/admin/products",   icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Pages",      href: "/admin/pages",      icon: FileText },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
  { label: "Settings",   href: "/admin/settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 min-h-screen bg-jorrey-black border-e border-white/5 flex flex-col">
      <div className="px-6 py-7 border-b border-white/5">
        <Link href="/admin" className="font-serif text-xl tracking-[0.15em] text-jorrey-white">JORREY</Link>
        <p className="text-jorrey-white/30 text-[10px] tracking-[0.2em] uppercase mt-0.5">Admin</p>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn("flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm",
                active ? "bg-jorrey-gold/10 text-jorrey-gold" : "text-jorrey-white/50 hover:text-jorrey-white hover:bg-white/5"
              )}>
              <Icon size={16} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-5 border-t border-white/5 flex items-center gap-3">
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        <span className="text-jorrey-white/40 text-xs">Account</span>
      </div>
    </aside>
  );
}
