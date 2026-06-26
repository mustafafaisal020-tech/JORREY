"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallLink({ isRTL }: { isRTL: boolean }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  }, [prompt]);

  if (standalone || !prompt) return null;

  return (
    <button
      onClick={install}
      className="flex items-center gap-1.5 text-xs tracking-wide opacity-50 hover:opacity-90 transition-opacity"
    >
      <Download size={12} />
      {isRTL ? "تثبيت التطبيق" : "Install App"}
    </button>
  );
}
