import React, { useState, useEffect } from "react";
import { 
  Moon, 
  Sun, 
  Monitor, 
  Download, 
  Check, 
  RefreshCw, 
  Sliders,
  X,
  Bell,
  ShieldCheck
} from "lucide-react";
import { AppSettings, AppearanceMode, DisplayScale, LanguageCode } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";
import { InstallGuideModal } from "./InstallGuideModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  pwa: PWAState;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  pwa,
}) => {
  const { 
    appearance, 
    displayScale, 
    language, 
    setAppearance, 
    setDisplayScale, 
    setLanguage, 
    t 
  } = settings;
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const isNotificationSupported = typeof window !== "undefined" && "Notification" in window;
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    isNotificationSupported ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    if (isNotificationSupported) {
      setNotifPermission(Notification.permission);
    }
  }, [isOpen, isNotificationSupported]);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (!isNotificationSupported) return;
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === "granted") {
        new Notification("Fixio", {
          body: language === "id" ? "Notifikasi sistem berhasil diaktifkan." : "System notifications enabled successfully.",
          icon: "/pwa-192x192.png",
        });
      }
    } catch (e) {
      console.warn("Notification request failed:", e);
    }
  };

  const handleCheckUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus(t("checkingUpdates"));
    try {
      await pwa.checkForUpdates();
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateStatus(t("updateLatest"));
        setTimeout(() => setUpdateStatus(null), 3000);
      }, 700);
    } catch {
      setIsUpdating(false);
      setUpdateStatus(t("updateLatest"));
      setTimeout(() => setUpdateStatus(null), 3000);
    }
  };

  const handleInstallClick = async () => {
    if (pwa.isInstalled) return;
    if (pwa.isInstallable) {
      const accepted = await pwa.install();
      if (!accepted) {
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#131317] text-zinc-900 dark:text-neutral-100 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-250"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-50 dark:bg-[#18181d] border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              {t("settingsTitle")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. TAMPILAN & TEMA */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-neutral-500 px-1">
              Tampilan & Tema
            </span>

            <div className="bg-zinc-50 dark:bg-[#18181d] rounded-xl border border-zinc-200/90 dark:border-white/[0.08] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-white block">Mode Tema</span>
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
                    {appearance === "dark" ? "Dark (Gelap)" : appearance === "light" ? "Light (Terang)" : "Sistem"}
                  </span>
                </div>

                <div className="inline-flex bg-zinc-200/80 dark:bg-[#121215] p-1 rounded-xl border border-zinc-300/60 dark:border-neutral-700/60">
                  {(["system", "light", "dark"] as AppearanceMode[]).map((mode) => {
                    const isActive = appearance === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setAppearance(mode)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? "bg-white dark:bg-[#25252d] text-zinc-900 dark:text-white font-bold shadow-xs"
                            : "text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {mode === "system" && <Monitor className="w-3 h-3" />}
                        {mode === "light" && <Sun className="w-3 h-3 text-amber-500" />}
                        {mode === "dark" && <Moon className="w-3 h-3 text-indigo-400" />}
                        <span>{t(mode)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bahasa */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-neutral-800/80">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-white block">Bahasa Aplikasi</span>
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
                    {language === "id" ? "Bahasa Indonesia" : "English (US)"}
                  </span>
                </div>

                <div className="inline-flex bg-zinc-200/80 dark:bg-[#121215] p-1 rounded-xl border border-zinc-300/60 dark:border-neutral-700/60">
                  {(["id", "en"] as LanguageCode[]).map((code) => {
                    const isActive = language === code;
                    return (
                      <button
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-500 text-black font-bold shadow-xs"
                            : "text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                      >
                        {code === "id" ? "ID" : "EN"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. APLIKASI PWA */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-neutral-500 px-1">
              Aplikasi & Update
            </span>

            <div className="bg-zinc-50 dark:bg-[#18181d] rounded-xl border border-zinc-200/90 dark:border-white/[0.08] divide-y divide-zinc-200 dark:divide-neutral-800/80">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-white block">Versi Fixio</span>
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-400">v{pwa.appVersion} Stable</span>
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-zinc-200/70 hover:bg-zinc-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-zinc-800 dark:text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? "Memeriksa..." : "Cek Update"}</span>
                </button>
              </div>

              {/* Install PWA */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-white block">Status Pasang</span>
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
                    {pwa.isInstalled ? "Terpasang di perangkat" : "Aplikasi Web Siap Pasang"}
                  </span>
                </div>

                {pwa.isInstalled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Terpasang
                  </span>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pasang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-[#18181d] border-t border-zinc-200 dark:border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
          >
            Selesai
          </button>
        </div>

        <InstallGuideModal
          isOpen={showInstallGuide}
          onClose={() => setShowInstallGuide(false)}
          language={language}
          isIOS={pwa.isIOS}
          isInstallable={pwa.isInstallable}
          onNativeInstall={pwa.install}
        />
      </div>
    </div>
  );
};
