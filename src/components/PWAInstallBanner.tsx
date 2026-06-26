"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function wasDismissed() {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_TTL;
}

function isIOSSafari() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [ios, setIos] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    if (wasDismissed()) return;

    setIsRTL(document.documentElement.dir === "rtl");

    if (isIOSSafari()) {
      setIos(true);
      const t = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setPrompt(null);
  }, [prompt]);

  if (!showBanner) return null;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed bottom-0 inset-x-0 z-[200] bg-jorrey-black border-t border-jorrey-gold/25 px-5 py-4 flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-300"
    >
      {/* Brand mark */}
      <div className="flex-shrink-0 w-10 h-10 border border-jorrey-gold/35 flex items-center justify-center">
        <span className="font-serif text-jorrey-gold text-lg font-bold leading-none">J</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-serif text-jorrey-white text-sm font-semibold leading-snug">
          {isRTL ? "تثبيت تطبيق جوري" : "Install Jorrey"}
        </p>
        {ios ? (
          <p className="text-jorrey-white/45 text-xs mt-0.5 leading-relaxed">
            {isRTL
              ? 'اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"'
              : 'Tap Share then "Add to Home Screen"'}
          </p>
        ) : (
          <p className="text-jorrey-white/45 text-xs mt-0.5">
            {isRTL
              ? "أضفه لشاشتك الرئيسية للوصول السريع"
              : "Add to home screen for quick access"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {ios ? (
          <Share size={16} className="text-jorrey-gold/60" />
        ) : (
          prompt && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-jorrey-gold text-jorrey-black text-[10px] font-semibold tracking-widest uppercase px-3 py-2 hover:bg-jorrey-beige transition-colors"
            >
              <Download size={11} />
              {isRTL ? "تثبيت" : "Install"}
            </button>
          )
        )}
        <button
          onClick={dismiss}
          className="text-jorrey-white/30 hover:text-jorrey-white/70 transition-colors p-1"
          aria-label={isRTL ? "إغلاق" : "Dismiss"}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
