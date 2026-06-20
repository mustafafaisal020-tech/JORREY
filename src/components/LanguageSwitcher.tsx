"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "ar", label: "Arabic", native: "العربية" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function switchLocale(code: string) {
    if (code === locale) return;
    startTransition(() => {
      // Set cookie (1 year) and reload so server reads new locale
      document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000;SameSite=Lax`;
      window.location.reload();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="flex items-center gap-1.5 text-jorrey-white/60 hover:text-jorrey-gold transition-colors duration-200 text-xs tracking-widest uppercase outline-none disabled:opacity-40"
        aria-label="Select language"
      >
        <Globe size={13} />
        <span>{locale.toUpperCase()}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[140px] rounded-none border-jorrey-white/10 bg-[#111] p-1"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
            className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer rounded-none focus:bg-jorrey-gold/10 focus:text-jorrey-gold"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-jorrey-white/80 text-xs tracking-wide">
                {lang.native}
              </span>
              <span className="text-jorrey-white/30 text-[10px]">
                {lang.label}
              </span>
            </div>
            {locale === lang.code && (
              <Check size={12} className="text-jorrey-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
