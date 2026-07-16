"use client";

import { useLocale } from "next-intl";
import { Check, Coins } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency, CURRENCIES } from "./CurrencyProvider";

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const locale = useLocale();
  const ar = locale === "ar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 text-jorrey-white/60 hover:text-jorrey-gold transition-colors duration-200 text-xs tracking-widest uppercase outline-none"
        aria-label={ar ? "اختر العملة" : "Select currency"}
      >
        <Coins size={13} />
        <span>{currency}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[160px] rounded-none border-jorrey-white/10 bg-[#111] p-1"
      >
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer rounded-none focus:bg-jorrey-gold/10 focus:text-jorrey-gold"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-jorrey-white/80 text-xs tracking-wide">
                {c.symbol} {ar ? c.labelAr : c.labelEn}
              </span>
              <span className="text-jorrey-white/30 text-[10px]">{c.code}</span>
            </div>
            {currency === c.code && (
              <Check size={12} className="text-jorrey-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
