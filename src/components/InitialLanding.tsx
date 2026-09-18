import React, { useState } from "react";
import { Settings as SettingsIcon, Download, ArrowRight, Sun, Moon, Monitor, Layers } from "lucide-react";
import { Logo } from "./Logo";
import { TypewriterText } from "./TypewriterText";
import { AppSettings } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";
import { InstallGuideModal } from "./InstallGuideModal";

interface InitialLandingProps {
  onOpenApp: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  pwa: PWAState;
}

export const InitialLanding: React.FC<InitialLandingProps> = ({
  onOpenApp,
  onOpenSettings,
  settings,
  pwa,
}) => {
  const { t, language, appearance, toggleAppearance, glassStyle, cycleGlassStyle } = settings;
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
    <div className="min-h-screen flex flex-col justify-between items-center px-6 py-10 sm:py-14 max-w-lg mx-auto select-none">
      {/* Top subtle controls bar */}
      <div className="w-full flex items-center justify-between">
        {/* Quick Glass Style Switcher Button */}
        <button
          onClick={cycleGlassStyle}
          className="ios-btn-glass px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 active:scale-95 cursor-pointer text-black/80 dark:text-white/80 transition-all border border-black/5 dark:border-white/10"
          title={`Glass Style: ${glassStyle.toUpperCase()} (Click to toggle)`}
        >
          <Layers className="w-3.5 h-3.5 text-[#007aff] dark:text-[#0a84ff]" />
          <span className="text-[11px] font-semibold capitalize">{glassStyle} Glass</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleAppearance}
            className="ios-btn-glass p-2.5 rounded-full text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white active:scale-95 cursor-pointer transition-colors border border-black/5 dark:border-white/10"
            aria-label={t("appearance")}
            title={`${t("appearance")}: ${appearance}`}
          >
            {appearance === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : appearance === "light" ? (
              <Moon className="w-4 h-4 text-indigo-500" />
            ) : (
              <Monitor className="w-4 h-4 text-[#8e8e93] dark:text-[#98989d]" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="ios-btn-glass p-2.5 rounded-full text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white active:scale-95 cursor-pointer transition-colors border border-black/5 dark:border-white/10"
            aria-label={t("settings")}
            title={t("settings")}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Centered Transparent Fixio Logo (Logo Only) */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        <div className="flex flex-col items-center space-y-3">
          {/* Transparent Logo Image with subtle smooth entry */}
          <Logo size="xl" animate className="drop-shadow-xs" />

          {/* Text-based brand name kept as a fallback so the headline
              never looks "empty" even if the logo image is slow to load */}
          <h1 className="sr-only">Fixio</h1>

          <p className="min-h-[2.75em] sm:min-h-[2.5em] text-sm sm:text-base text-[#8e8e93] dark:text-[#98989d] font-normal tracking-tight max-w-xs leading-relaxed">
            <TypewriterText key={language} text={t("landingDescription")} />
          </p>
        </div>

        {/* Minimal Glass Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 w-full max-w-xs">
          {/* Open App */}
          <button
            onClick={onOpenApp}
            className="ios-btn-glass w-full py-3 px-6 rounded-2xl text-sm font-semibold text-black dark:text-white flex items-center justify-center gap-2 cursor-pointer active:scale-97 border border-black/5 dark:border-white/15"
          >
            <span>{t("openApp")}</span>
            <ArrowRight className="w-4 h-4 text-[#8e8e93] dark:text-[#98989d]" />
          </button>

          {/* Install App (if not yet installed) */}
          {!pwa.isInstalled && (
            <button
              onClick={handleInstallClick}
              className="ios-btn-glass w-full py-3 px-6 rounded-2xl text-sm font-semibold text-[#007aff] dark:text-[#0a84ff] flex items-center justify-center gap-2 cursor-pointer active:scale-97 border border-black/5 dark:border-white/15"
            >
              <Download className="w-4 h-4" />
              <span>{t("installApp")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Minimal Footer */}
      <div className="w-full flex items-center justify-between text-xs text-[#8e8e93] dark:text-[#98989d] pt-4">
        <span>v{pwa.appVersion}</span>
        <button
          onClick={onOpenSettings}
          className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          {t("settings")}
        </button>
      </div>

      {/* Universal PWA Install Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        language={language}
        isIOS={pwa.isIOS}
        isInstallable={pwa.isInstallable}
        onNativeInstall={pwa.install}
      />
    </div>
  );
};
