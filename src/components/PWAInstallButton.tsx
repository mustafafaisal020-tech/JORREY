"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOSSafari() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
}

interface Props {
  isRTL: boolean;
  compact?: boolean;
}

export default function PWAInstallButton({ isRTL, compact = false }: Props) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setIos(isIOSSafari());

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = useCallback(async () => {
    if (prompt) {
      // Chrome / Android / Edge — native install sheet
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setPrompt(null);
    } else {
      // iOS or any browser without native prompt — show instructions modal
      setModalOpen(true);
    }
  }, [prompt]);

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={isRTL ? "تثبيت التطبيق" : "Install app"}
        className={`flex items-center gap-1.5 text-jorrey-white/60 hover:text-jorrey-gold transition-colors tracking-widest uppercase ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        <Download size={14} />
        {!compact && <span>{isRTL ? "تثبيت" : "Get the App"}</span>}
      </button>

      {/* Instructions modal — shown for iOS or browsers without native prompt */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            dir={isRTL ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm mx-4 mb-6 bg-jorrey-black border border-jorrey-gold/25 p-6 animate-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-jorrey-gold/35 flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-lg font-bold text-jorrey-gold leading-none">J</span>
                </div>
                <div>
                  <p className="font-serif text-jorrey-white font-semibold text-sm">
                    {isRTL ? "تثبيت جوري" : "Install Jorrey"}
                  </p>
                  <p className="text-jorrey-white/40 text-[10px] tracking-wide uppercase mt-0.5">
                    {isRTL ? "أضفه لشاشتك الرئيسية" : "Add to your home screen"}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-jorrey-white/30 hover:text-jorrey-white/70 transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            {ios ? (
              // iOS Safari steps
              <ol className="space-y-4 text-sm text-jorrey-white/70 leading-relaxed">
                <li className="flex items-start gap-3">
                  <Step n={1} />
                  <span>
                    {isRTL
                      ? <span>اضغط على زر <Share size={13} className="inline mx-1 text-jorrey-gold" /> المشاركة أسفل Safari</span>
                      : <span>Tap the <Share size={13} className="inline mx-1 text-jorrey-gold" /> Share button at the bottom of Safari</span>
                    }
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Step n={2} />
                  <span>{isRTL ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Scroll down and tap "Add to Home Screen"'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Step n={3} />
                  <span>{isRTL ? 'اضغط "إضافة"' : 'Tap "Add" to confirm'}</span>
                </li>
              </ol>
            ) : (
              // Generic browser steps (desktop Chrome menu, Firefox, etc.)
              <ol className="space-y-4 text-sm text-jorrey-white/70 leading-relaxed">
                <li className="flex items-start gap-3">
                  <Step n={1} />
                  <span>{isRTL ? "افتح قائمة المتصفح (ثلاث نقاط ⋮ أو ⋯)" : "Open your browser menu (⋮ or ⋯ icon)"}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Step n={2} />
                  <span>{isRTL ? 'ابحث عن خيار "تثبيت" أو "إضافة إلى الشاشة الرئيسية"' : 'Look for "Install Jorrey" or "Add to Home Screen"'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Step n={3} />
                  <span>{isRTL ? "اضغط تثبيت وسيظهر التطبيق على جهازك" : "Tap Install — the app will appear on your device"}</span>
                </li>
              </ol>
            )}

            <button
              onClick={() => setModalOpen(false)}
              className="mt-5 w-full border border-jorrey-gold/40 text-jorrey-gold text-[10px] tracking-widest uppercase py-3 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors"
            >
              {isRTL ? "حسناً" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-5 h-5 border border-jorrey-gold/40 flex items-center justify-center text-jorrey-gold text-[10px] font-bold mt-0.5">
      {n}
    </span>
  );
}
