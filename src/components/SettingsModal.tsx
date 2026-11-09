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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#131317] text-neutral-100 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#18181d] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#ffe600]" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              {t("settingsTitle")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. TAMPILAN & TEMA */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              Tampilan & Tema
            </span>

            <div className="bg-[#18181d] rounded-xl border border-neutral-800 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Mode Tema</span>
                  <span className="text-[11px] text-neutral-400">
                    {appearance === "dark" ? "Dark (Gelap)" : appearance === "light" ? "Light (Terang)" : "Sistem"}
                  </span>
                </div>

                <div className="inline-flex bg-[#121215] p-1 rounded-xl border border-neutral-700/60">
                  {(["system", "light", "dark"] as AppearanceMode[]).map((mode) => {
                    const isActive = appearance === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setAppearance(mode)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? "bg-white text-black font-bold shadow-xs"
                            : "text-neutral-400 hover:text-white"
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
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <span className="font-semibold text-white block">Bahasa Aplikasi</span>
                  <span className="text-[11px] text-neutral-400">
                    {language === "id" ? "Bahasa Indonesia" : "English (US)"}
                  </span>
                </div>

                <div className="inline-flex bg-[#121215] p-1 rounded-xl border border-neutral-700/60">
                  {(["id", "en"] as LanguageCode[]).map((code) => {
                    const isActive = language === code;
                    return (
                      <button
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#ffe600] text-black font-bold shadow-xs"
                            : "text-neutral-400 hover:text-white"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-1">
              Aplikasi & Update
            </span>

            <div className="bg-[#18181d] rounded-xl border border-neutral-800 divide-y divide-neutral-800/80">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Versi Fixio</span>
                  <span className="text-[11px] text-neutral-400">v{pwa.appVersion} Stable</span>
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? "Memeriksa..." : "Cek Update"}</span>
                </button>
              </div>

              {/* Install PWA */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Status Pasang</span>
                  <span className="text-[11px] text-neutral-400">
                    {pwa.isInstalled ? "Terpasang di perangkat" : "Aplikasi Web Siap Pasang"}
                  </span>
                </div>

                {pwa.isInstalled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <Check className="w-3 h-3" /> Terpasang
                  </span>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="px-3 py-1.5 rounded-lg bg-[#ffe600] text-black font-bold text-xs flex items-center gap-1.5 hover:bg-[#ebd300] transition cursor-pointer"
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
        <div className="px-5 py-3 bg-[#18181d] border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
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
