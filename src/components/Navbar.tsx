"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ShoppingBag, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import LanguageSwitcher from "./LanguageSwitcher";
import { useCart } from "./CartProvider";
import { useUserLists } from "./UserListsProvider";
import CustomerAccountModal from "./CustomerAccountModal";
import PWAInstallButton from "./PWAInstallButton";
import type { Category } from "@/lib/category-types";

interface NavbarProps {
  whatsappNumber?: string;
  currencySymbol?: string;
  categories?: Category[];
}

export default function Navbar({ categories = [] }: NavbarProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { count, setOpen } = useCart();
  const { user } = useUser();
  const { unreadNotifications } = useUserLists();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-jorrey-black/95 backdrop-blur-md border-b border-jorrey-gold/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-2xl tracking-[0.15em] text-jorrey-white font-medium flex-shrink-0"
          >
            JORREY
          </Link>

          {/* Desktop nav — DB categories */}
          <nav className="hidden md:flex items-center gap-8" dir={isRTL ? "rtl" : "ltr"}>
            {categories.map((cat) => {
              const label = isRTL && cat.nameAr ? cat.nameAr : cat.name;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="text-jorrey-white/70 hover:text-jorrey-gold text-xs tracking-widests uppercase transition-colors duration-300"
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop right: install | language | cart | account */}
          <div className="hidden md:flex items-center gap-5">
            <PWAInstallButton isRTL={isRTL} />
            <LanguageSwitcher />
            <button
              onClick={() => setOpen(true)}
              className="relative text-jorrey-white/70 hover:text-jorrey-gold transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-1.5 -end-1.5 bg-jorrey-gold text-jorrey-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
            <button
              onClick={() => setAccountOpen(true)}
              className={`relative transition-colors ${user ? "text-jorrey-gold" : "text-jorrey-white/70 hover:text-jorrey-gold"}`}
              aria-label="Account"
            >
              <User size={18} />
              {user && unreadNotifications > 0 && (
                <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>

          {/* Mobile: language + cart + hamburger */}
          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => setOpen(true)}
              className="relative text-jorrey-white/70 hover:text-jorrey-gold transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-1.5 -end-1.5 bg-jorrey-gold text-jorrey-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
            <button
              className="text-jorrey-white"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-1.5 w-6">
                <span className={`block h-px bg-jorrey-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2.5" : ""}`} />
                <span className={`block h-px bg-jorrey-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-px bg-jorrey-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-jorrey-black flex flex-col items-center justify-center gap-10 md:hidden"
          >
            {categories.map((cat, i) => {
              const label = isRTL && cat.nameAr ? cat.nameAr : cat.name;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="font-serif text-3xl text-jorrey-white hover:text-jorrey-gold italic transition-colors"
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center gap-6">
              <button
                onClick={() => { setMenuOpen(false); setAccountOpen(true); }}
                className={`flex items-center gap-2 text-sm tracking-widests uppercase transition-colors ${user ? "text-jorrey-gold" : "text-jorrey-white/50 hover:text-jorrey-gold"}`}
              >
                <User size={14} />
                {isRTL ? "الحساب" : "Account"}
              </button>
              <PWAInstallButton isRTL={isRTL} compact={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomerAccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}
