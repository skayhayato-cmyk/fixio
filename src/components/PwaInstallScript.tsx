"use client";

import { useEffect } from "react";

export default function PwaInstallScript() {
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).__fixioInstallPrompt = e;
      window.dispatchEvent(new Event("fixio:bipready"));
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return null;
}
