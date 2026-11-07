import React, { useState, useEffect } from "react";
import { 
  Moon, 
  Sun, 
  Monitor, 
  Download, 
  Check, 
  RefreshCw, 
  Smartphone,
  Sparkles,
  Layers,
  Sliders,
  Cuboid
} from "lucide-react";
import { AppSettings, AppearanceMode, DisplayScale, LanguageCode, GlassStyle } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";
import { Logo } from "./Logo";
import { GlassStyleVisualPicker } from "./GlassStyleVisualPicker";
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
    iosUIUX,
    glassStyle,
    smooth3D,
    setAppearance, 
    setDisplayScale, 
    setLanguage, 
    setIosUIUX,
    setGlassStyle,
    setSmooth3D,
    toggleSmooth3D,
    toggleIosUIUX,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-ios-fade">
      <div 
        className="w-full max-w-lg bg-[#f2f2f7] dark:bg-[#000000] text-black dark:text-white rounded-3xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* iOS Sheet Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#121214] border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#007aff]" />
            <h2 className="text-base font-semibold text-black dark:text-white tracking-tight">
              {t("settingsTitle")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:bg-[#007aff]/10 transition active:scale-95 cursor-pointer"
          >
            {t("done")}
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* 1. GENERAL & THEME (Dark mode must be pitch dark) */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] uppercase tracking-wider px-2">
              {t("generalSection")}
            </span>

            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 shadow-xs overflow-hidden transition-colors">
              {/* Color Theme (Light, Dark, System) */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-medium text-black dark:text-white block">
                    {t("appearance")}
                  </span>
                  <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                    {appearance === "system" ? t("system") : appearance === "light" ? t("light") : t("dark")}
                  </span>
                </div>
                <div className="inline-flex p-0.5 bg-[#e5e5ea] dark:bg-[#1c1c1e] rounded-xl self-start sm:self-auto border border-black/5 dark:border-white/10 transition-colors">
                  {(["system", "light", "dark"] as AppearanceMode[]).map((mode) => {
                    const isActive = appearance === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setAppearance(mode)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isActive
                            ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-xs font-semibold"
                            : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
                        }`}
                      >
                        {mode === "system" && <Monitor className="w-3.5 h-3.5" />}
                        {mode === "light" && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                        {mode === "dark" && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{mode === "dark" ? t("darkLabel") : t(mode)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* iOS UI/UX Toggle Switch */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#007aff]" />
                    <span className="font-medium text-black dark:text-white block">
                      {t("iosUIUX")}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d] block leading-tight">
                    {t("iosUIUXDesc")}
                  </span>
                </div>
                
                {/* Authentic iOS Style Toggle Button Switch (Exact Apple standard 51x31 design) */}
                <button
                  type="button"
                  id="toggle-ios-uiux-switch"
                  role="switch"
                  aria-checked={iosUIUX}
                  onClick={toggleIosUIUX}
                  className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-250 ease-in-out focus:outline-none shadow-inner ${
                    iosUIUX ? "bg-[#34c759]" : "bg-[#e5e5ea] dark:bg-[#39393d]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] ring-0 transition duration-250 ease-in-out ${
                      iosUIUX ? "translate-x-[20px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Smooth 3D Button Animation Toggle Switch */}
              <div className="p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <Cuboid className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-medium text-black dark:text-white block">
                      {t("smooth3DTitle")}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d] block leading-tight">
                    {t("smooth3DDesc")}
                  </span>
                </div>
                
                {/* Authentic iOS Style Toggle Button Switch for 3D Animation */}
                <button
                  type="button"
                  id="toggle-smooth-3d-switch"
                  role="switch"
                  aria-checked={smooth3D}
                  onClick={toggleSmooth3D}
                  className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-250 ease-in-out focus:outline-none shadow-inner ${
                    smooth3D ? "bg-[#34c759]" : "bg-[#e5e5ea] dark:bg-[#39393d]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] ring-0 transition duration-250 ease-in-out ${
                      smooth3D ? "translate-x-[20px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* UI Display Scale (Standard, Medium, High) */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-medium text-black dark:text-white block">
                    {t("displayScale")}
                  </span>
                  <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                    {t("displayScaleDesc")}
                  </span>
                </div>
                <div className="inline-flex p-0.5 bg-[#e5e5ea] dark:bg-[#1c1c1e] rounded-xl self-start sm:self-auto border border-black/5 dark:border-white/10 transition-colors">
                  {(["standard", "medium", "high"] as DisplayScale[]).map((scale) => {
                    const isActive = displayScale === scale;
                    return (
                      <button
                        key={scale}
                        onClick={() => setDisplayScale(scale)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isActive
                            ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-xs font-semibold"
                            : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
                        }`}
                      >
                        {scale === "standard" && <span className="text-[10px] font-bold">1x</span>}
                        {scale === "medium" && <span className="text-[10px] font-bold">1.2x</span>}
                        {scale === "high" && <span className="text-[10px] font-bold">1.4x</span>}
                        <span>{t(scale)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selector */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-medium text-black dark:text-white block">
                    {t("language")}
                  </span>
                  <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                    {language === "id" ? "Bahasa Indonesia" : "English (US)"}
                  </span>
                </div>
                <div className="inline-flex p-0.5 bg-[#e5e5ea] dark:bg-[#1c1c1e] rounded-xl self-start sm:self-auto border border-black/5 dark:border-white/10 transition-colors">
                  {(["id", "en"] as LanguageCode[]).map((code) => {
                    const isActive = language === code;
                    return (
                      <button
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-xs font-semibold"
                            : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
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

          {/* 2. GLASSMORPHISM STYLE CHOOSER - 100% Mockup Authentic UI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] uppercase tracking-wider">
                {t("glassSection")}
              </span>
              <span className="text-[10px] font-bold text-[#007aff] uppercase px-2 py-0.5 bg-[#007aff]/10 rounded-full">
                Active: {glassStyle}
              </span>
            </div>

            {/* Render 100% exact replica of the 3-card glass visual selector */}
            <GlassStyleVisualPicker
              selectedStyle={glassStyle}
              smooth3D={smooth3D}
              language={language}
              onSelect={(style) => {
                setGlassStyle(style);
                if (!iosUIUX && style !== "flat") {
                  setIosUIUX(true);
                }
              }}
            />
          </div>

          {/* 3. APP & SYSTEM SECTION */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] uppercase tracking-wider px-2">
              {t("appSection")}
            </span>

            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 shadow-xs overflow-hidden transition-colors">
              {/* Install App Row */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-black dark:text-white">{t("installApp")}</p>
                  <p className="text-xs text-[#8e8e93] dark:text-[#98989d]">
                    {pwa.isInstalled
                      ? t("statusInstalled")
                      : pwa.isInstallable || pwa.isIOS
                      ? t("statusAvailable")
                      : t("statusBrowser")}
                  </p>
                </div>

                {pwa.isInstalled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                    {t("installed")}
                  </span>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="ios-btn-glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("installApp")}</span>
                  </button>
                )}
              </div>

              {/* Notifications Row (only if supported) */}
              {isNotificationSupported && (
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black dark:text-white">{t("notifications")}</p>
                    <p className="text-xs text-[#8e8e93] dark:text-[#98989d]">
                      {notifPermission === "granted"
                        ? t("notifGranted")
                        : notifPermission === "denied"
                        ? t("notifDenied")
                        : t("notifDefault")}
                    </p>
                  </div>

                  {notifPermission === "granted" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      {t("notifGranted")}
                    </span>
                  ) : notifPermission === "denied" ? (
                    <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                      {t("notifDenied")}
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestNotification}
                      className="ios-btn-glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] active:scale-95 cursor-pointer"
                    >
                      {t("notifDefault")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. PWA SETTINGS */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] uppercase tracking-wider px-2">
              {t("pwaSection")}
            </span>

            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/10 shadow-xs overflow-hidden transition-colors">
              {/* Install Status */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-black dark:text-white font-medium">{t("installStatus")}</span>
                <span className="text-xs text-[#8e8e93] dark:text-[#98989d]">
                  {pwa.isInstalled ? t("statusInstalled") : pwa.isInstallable ? t("statusAvailable") : t("statusBrowser")}
                </span>
              </div>

              {/* App Version */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-black dark:text-white font-medium">{t("appVersion")}</span>
                <span className="text-xs font-mono text-[#8e8e93] dark:text-[#98989d]">
                  v{pwa.appVersion}
                </span>
              </div>

              {/* Connection Mode Status — Fixio is online-only: every tool
                  calls a live API, so this reflects real connectivity
                  rather than any offline caching capability. */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-black dark:text-white font-medium">{t("offlineSupport")}</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    pwa.isOnline
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      pwa.isOnline ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {pwa.isOnline ? t("offlineActive") : t("offlineReady")}
                </span>
              </div>

              {/* Update App Option */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-medium text-black dark:text-white">{t("updateApp")}</p>
                  {updateStatus && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {updateStatus}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCheckUpdate}
                  disabled={isUpdating}
                  className="ios-btn-glass px-3.5 py-1.5 rounded-full text-xs font-medium text-black dark:text-white flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                  <span>{isUpdating ? t("checkingUpdates") : t("updateApp")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. ABOUT FIXIO */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] uppercase tracking-wider px-2">
              {t("aboutFixio")}
            </span>

            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-4 shadow-xs space-y-2 transition-colors">
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <div>
                  <p className="text-xs text-[#8e8e93] dark:text-[#98989d]">
                    By Nexa • v{pwa.appVersion}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#8e8e93] dark:text-[#98989d] leading-relaxed pt-1">
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
