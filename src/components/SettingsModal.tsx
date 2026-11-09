import React, { useState, useEffect } from "react";
import { 
  Moon, 
  Sun, 
  Monitor, 
  Download, 
  Check, 
  RefreshCw, 
  Sliders
} from "lucide-react";
import { AppSettings, AppearanceMode, DisplayScale, LanguageCode } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";
import { Logo } from "./Logo";
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

  // Notification state
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 animate-ios-fade">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] border-3 border-[#0a0a0a] dark:border-[#f5f5f0] shadow-[8px_8px_0px_0px_#0a0a0a] dark:shadow-[8px_8px_0px_0px_#ffe600] overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Brutalist Header */}
        <div className="px-5 py-4 bg-[#ffe600] text-black border-b-3 border-[#0a0a0a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 stroke-[3]" />
            <h2 className="text-base font-black uppercase tracking-wider">
              {t("settingsTitle")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-black text-[#ffe600] border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer"
          >
            {t("done")}
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* 1. GENERAL & THEME */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-black dark:text-[#ffe600] tracking-wider">
              {t("generalSection")}
            </span>

            <div className="bg-[#f4f4f0] dark:bg-[#222226] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] divide-y-2 divide-[#0a0a0a] dark:divide-[#f5f5f0] shadow-[3px_3px_0px_0px_#0a0a0a] dark:shadow-[3px_3px_0px_0px_#ffe600]">
              {/* Color Theme (Light, Dark, System) */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0] block">
                    {t("appearance")}
                  </span>
                  <span className="text-xs font-medium text-[#555550] dark:text-[#9e9e98]">
                    {appearance === "system" ? t("system") : appearance === "light" ? t("light") : t("dark")}
                  </span>
                </div>
                <div className="inline-flex gap-1.5 self-start sm:self-auto">
                  {(["system", "light", "dark"] as AppearanceMode[]).map((mode) => {
                    const isActive = appearance === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setAppearance(mode)}
                        className={`px-3 py-1.5 text-xs font-extrabold uppercase border-2 border-[#0a0a0a] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isActive
                            ? "bg-[#ffe600] text-black shadow-[2px_2px_0px_0px_#0a0a0a]"
                            : "bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] hover:bg-[#ffe600] hover:text-black"
                        }`}
                      >
                        {mode === "system" && <Monitor className="w-3.5 h-3.5 stroke-[2.5]" />}
                        {mode === "light" && <Sun className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />}
                        {mode === "dark" && <Moon className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />}
                        <span>{mode === "dark" ? t("darkLabel") : t(mode)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UI Display Scale */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0] block">
                    {t("displayScale")}
                  </span>
                  <span className="text-xs font-medium text-[#555550] dark:text-[#9e9e98]">
                    {t("displayScaleDesc")}
                  </span>
                </div>
                <div className="inline-flex gap-1.5 self-start sm:self-auto">
                  {(["standard", "medium", "high"] as DisplayScale[]).map((scale) => {
                    const isActive = displayScale === scale;
                    return (
                      <button
                        key={scale}
                        onClick={() => setDisplayScale(scale)}
                        className={`px-3 py-1.5 text-xs font-extrabold uppercase border-2 border-[#0a0a0a] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isActive
                            ? "bg-[#ffe600] text-black shadow-[2px_2px_0px_0px_#0a0a0a]"
                            : "bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] hover:bg-[#ffe600] hover:text-black"
                        }`}
                      >
                        <span>{t(scale)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selector */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0] block">
                    {t("language")}
                  </span>
                  <span className="text-xs font-medium text-[#555550] dark:text-[#9e9e98]">
                    {language === "id" ? "Bahasa Indonesia" : "English (US)"}
                  </span>
                </div>
                <div className="inline-flex gap-1.5 self-start sm:self-auto">
                  {(["id", "en"] as LanguageCode[]).map((code) => {
                    const isActive = language === code;
                    return (
                      <button
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`px-3 py-1.5 text-xs font-extrabold uppercase border-2 border-[#0a0a0a] transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#ffe600] text-black shadow-[2px_2px_0px_0px_#0a0a0a]"
                            : "bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] hover:bg-[#ffe600] hover:text-black"
                        }`}
                      >
                        {code === "id" ? t("indonesia") : t("english")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. APP & SYSTEM SECTION */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-black dark:text-[#ffe600] tracking-wider">
              {t("appSection")}
            </span>

            <div className="bg-[#f4f4f0] dark:bg-[#222226] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] divide-y-2 divide-[#0a0a0a] dark:divide-[#f5f5f0] shadow-[3px_3px_0px_0px_#0a0a0a] dark:shadow-[3px_3px_0px_0px_#ffe600]">
              {/* Install App Row */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0]">{t("installApp")}</p>
                  <p className="text-xs text-[#555550] dark:text-[#9e9e98]">
                    {pwa.isInstalled
                      ? t("statusInstalled")
                      : pwa.isInstallable || pwa.isIOS
                      ? t("statusAvailable")
                      : t("statusBrowser")}
                  </p>
                </div>

                {pwa.isInstalled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-black bg-[#ffe600] border border-black px-2.5 py-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    {t("installed")}
                  </span>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="px-3.5 py-1.5 bg-[#ffe600] text-black border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t("installApp")}</span>
                  </button>
                )}
              </div>

              {/* Notifications Row */}
              {isNotificationSupported && (
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0]">{t("notifications")}</p>
                    <p className="text-xs text-[#555550] dark:text-[#9e9e98]">
                      {notifPermission === "granted"
                        ? t("notifGranted")
                        : notifPermission === "denied"
                        ? t("notifDenied")
                        : t("notifDefault")}
                    </p>
                  </div>

                  {notifPermission === "granted" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase text-black bg-[#ffe600] border border-black px-2.5 py-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      {t("notifGranted")}
                    </span>
                  ) : notifPermission === "denied" ? (
                    <span className="text-xs text-rose-600 font-bold uppercase">
                      {t("notifDenied")}
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestNotification}
                      className="px-3.5 py-1.5 bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] border-2 border-black dark:border-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                    >
                      {t("notifDefault")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. PWA SETTINGS */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-black dark:text-[#ffe600] tracking-wider">
              {t("pwaSection")}
            </span>

            <div className="bg-[#f4f4f0] dark:bg-[#222226] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] divide-y-2 divide-[#0a0a0a] dark:divide-[#f5f5f0] shadow-[3px_3px_0px_0px_#0a0a0a] dark:shadow-[3px_3px_0px_0px_#ffe600]">
              <div className="p-3.5 flex items-center justify-between">
                <span className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0]">{t("installStatus")}</span>
                <span className="text-xs font-bold text-[#555550] dark:text-[#9e9e98]">
                  {pwa.isInstalled ? t("statusInstalled") : pwa.isInstallable ? t("statusAvailable") : t("statusBrowser")}
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <span className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0]">{t("appVersion")}</span>
                <span className="text-xs font-mono font-bold bg-[#ffe600] text-black px-1.5 py-0.5 border border-black">
                  v{pwa.appVersion}
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-extrabold uppercase text-[#0a0a0a] dark:text-[#f5f5f0]">{t("updateApp")}</p>
                  {updateStatus && (
                    <p className="text-[11px] text-emerald-600 dark:text-[#ffe600] font-bold">
                      {updateStatus}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={isUpdating}
                  className="px-3.5 py-1.5 bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] border-2 border-black dark:border-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? t("checkingUpdates") : t("updateApp")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. ABOUT FIXIO */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-black dark:text-[#ffe600] tracking-wider">
              {t("aboutFixio")}
            </span>

            <div className="bg-[#f4f4f0] dark:bg-[#222226] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] p-4 shadow-[3px_3px_0px_0px_#0a0a0a] dark:shadow-[3px_3px_0px_0px_#ffe600] space-y-2">
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <div>
                  <p className="text-xs font-bold text-[#555550] dark:text-[#9e9e98]">
                    Engineered by Nexa • v{pwa.appVersion}
                  </p>
                </div>
              </div>

              <p className="text-xs font-medium text-[#555550] dark:text-[#9e9e98] leading-relaxed pt-1">
                {t("aboutDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Universal PWA Installation Guide Modal */}
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
