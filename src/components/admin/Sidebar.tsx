"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  Tag,
  FileText,
  Settings,
  Users,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/roles";

const ALL_NAV = [
  { label: "Overview",   labelAr: "الرئيسية",   href: "/admin",            icon: LayoutDashboard, adminOnly: false },
  { label: "Orders",     labelAr: "الطلبات",    href: "/admin/orders",     icon: ShoppingBag,     adminOnly: false },
  { label: "Customers",  labelAr: "العملاء",    href: "/admin/customers",  icon: Users,           adminOnly: false },
  { label: "Products",   labelAr: "المنتجات",   href: "/admin/products",   icon: Package,         adminOnly: true  },
  { label: "Categories", labelAr: "التصنيفات",  href: "/admin/categories", icon: Tag,             adminOnly: true  },
  { label: "Pages",      labelAr: "الصفحات",    href: "/admin/pages",      icon: FileText,        adminOnly: true  },
  { label: "Settings",   labelAr: "الإعدادات",  href: "/admin/settings",   icon: Settings,        adminOnly: true  },
  { label: "Team",       labelAr: "الفريق",     href: "/admin/team",       icon: UsersRound,      adminOnly: true  },
];

interface Props {
  role: Role | null;
}

export default function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const isAdmin = role === "admin";
  const nav = ALL_NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-60 min-h-screen bg-jorrey-black border-e border-white/5 flex flex-col">
      <div className="px-6 py-7 border-b border-white/5">
        <Link href="/admin" className="font-serif text-xl tracking-[0.15em] text-jorrey-white">JORREY</Link>
        <p className="text-jorrey-white/30 text-[10px] tracking-[0.2em] uppercase mt-0.5">
          {isAdmin ? "Admin" : (isRTL ? "موظف" : "Employee")}
        </p>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map(({ label, labelAr, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm",
                active
                  ? "bg-jorrey-gold/10 text-jorrey-gold"
                  : "text-jorrey-white/50 hover:text-jorrey-white hover:bg-white/5"
              )}>
              <Icon size={16} />
              {isRTL ? labelAr : label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-5 border-t border-white/5 flex items-center gap-3">
        <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        <span className="text-jorrey-white/40 text-xs">
          {isRTL ? "الحساب" : "Account"}
        </span>
      </div>
    </aside>
  );
}
