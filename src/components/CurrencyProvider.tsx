"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface CurrencyDef {
  code: string;
  symbol: string;
  labelEn: string;
  labelAr: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: "USD", symbol: "$",   labelEn: "US Dollar",     labelAr: "دولار أمريكي" },
  { code: "IQD", symbol: "د.ع", labelEn: "Iraqi Dinar",   labelAr: "دينار عراقي"  },
];

interface CurrencyContextValue {
  currency: string;
  symbol: string;
  setCurrency: (code: string) => void;
  /** Convert a USD price to the selected currency */
  convert: (usdPrice: number) => number;
  /** Format a USD price for display in selected currency */
  format: (usdPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  symbol: "$",
  setCurrency: () => {},
  convert: (p) => p,
  format: (p) => `$${p.toLocaleString()}`,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

const COOKIE = "JORREY_CURRENCY";

function readCookie(): string {
  if (typeof document === "undefined") return "USD";
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "USD";
}

interface Props {
  children: React.ReactNode;
  /** Exchange rates from server settings, e.g. { IQD: 1310 } */
  exchangeRates: Record<string, number>;
}

export default function CurrencyProvider({ children, exchangeRates }: Props) {
  const [currency, setCurrencyState] = useState<string>("USD");

  // Read from cookie on mount (client only)
  useEffect(() => {
    const saved = readCookie();
    const valid = CURRENCIES.find((c) => c.code === saved);
    if (valid) setCurrencyState(saved);
  }, []);

  const setCurrency = useCallback((code: string) => {
    const valid = CURRENCIES.find((c) => c.code === code);
    if (!valid) return;
    setCurrencyState(code);
    document.cookie = `${COOKIE}=${code};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  const convert = useCallback((usdPrice: number): number => {
    if (currency === "USD") return usdPrice;
    const rate = exchangeRates[currency] ?? 1;
    return Math.round(usdPrice * rate);
  }, [currency, exchangeRates]);

  const def = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const format = useCallback((usdPrice: number): string => {
    const converted = convert(usdPrice);
    // IQD: no decimals, space before symbol for RTL friendliness
    if (currency === "IQD") return `${converted.toLocaleString()} ${def.symbol}`;
    return `${def.symbol}${converted.toLocaleString()}`;
  }, [convert, currency, def.symbol]);

  return (
    <CurrencyContext.Provider value={{ currency, symbol: def.symbol, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}
