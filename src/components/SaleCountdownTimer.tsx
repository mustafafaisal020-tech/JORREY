"use client";

import { useEffect, useState } from "react";

interface Props {
  endsAt: string;       // UTC ISO string
  label: string;        // Already resolved for current locale
  onExpiry: "hide" | "show_ended";
  endedLabel: string;   // "Offer Ended" / "انتهى العرض"
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isRTL: boolean;
}

interface Parts { d: number; h: number; m: number; s: number }

function compute(endsAt: string): Parts | null {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function SaleCountdownTimer({
  endsAt, label, onExpiry, endedLabel, days, hours, minutes, seconds, isRTL,
}: Props) {
  const [parts, setParts] = useState<Parts | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setParts(compute(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  // Avoid hydration mismatch — render nothing until client mounts
  if (!mounted) return null;

  // Timer has expired
  if (parts === null) {
    if (onExpiry === "hide") return null;
    return (
      <div className="mt-6 mb-2">
        <p className="text-xs tracking-[0.25em] uppercase text-gray-400">
          {endedLabel}
        </p>
        <div className="w-12 h-px bg-red-600 mt-6" />
      </div>
    );
  }

  const units = [
    { val: parts.d, label: days },
    { val: parts.h, label: hours },
    { val: parts.m, label: minutes },
    { val: parts.s, label: seconds },
  ];

  return (
    <div className="mt-8 mb-2">
      {label && (
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-4">
          {label}
        </p>
      )}
      <div className={`flex items-start gap-3 sm:gap-5 ${isRTL ? "flex-row-reverse" : ""}`}>
        {units.map(({ val, label: unitLabel }, i) => (
          <div key={i} className={`flex items-start gap-3 sm:gap-5 ${isRTL ? "flex-row-reverse" : ""}`}>
            {i > 0 && (
              <span className="text-2xl sm:text-3xl font-serif text-gray-300 leading-none mt-1 select-none">
                :
              </span>
            )}
            <div className="flex flex-col items-center gap-1.5 min-w-[3rem]">
              <span className="font-serif text-3xl sm:text-4xl tabular-nums text-jorrey-black leading-none tracking-tight">
                {pad(val)}
              </span>
              <span className="text-[9px] tracking-[0.25em] uppercase text-gray-400">
                {unitLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="w-12 h-px bg-red-600 mt-6" />
    </div>
  );
}
