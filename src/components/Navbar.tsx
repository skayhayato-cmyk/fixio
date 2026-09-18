import React, { useState } from "react";
import { Search, Settings as SettingsIcon, Download, X, Sun, Moon, Monitor, Sparkles, Layers } from "lucide-react";
import { Logo } from "./Logo";
import { AppSettings } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";
import { InstallGuideModal } from "./InstallGuideModal";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onHomeClick: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  pwa: PWAState;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onHomeClick,
  onOpenSettings,
  settings,
  pwa,
}) => {
  const { t, language, appearance, toggleAppearance, iosUIUX, glassStyle, cycleGlassStyle } = settings;
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
    <header className="sticky top-0 z-40 ios-navbar-glass border-b border-black/5 dark:border-white/10 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand */}
        <Logo size="sm" onClick={onHomeClick} />

        {/* Minimal iOS Search Field */}
        <div className="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#8e8e93] dark:text-[#98989d] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#767680]/12 dark:bg-[#767680]/24 border-0 rounded-xl text-xs font-normal text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-1 focus:ring-[#007aff] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 text-[#8e8e93] hover:text-black dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Glass Style Switcher (Clear -> Frosted -> Blur -> Flat) */}
          <button
            onClick={cycleGlassStyle}
            className="ios-btn-glass px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 active:scale-95 cursor-pointer text-black/80 dark:text-white/80 transition-all border border-black/5 dark:border-white/10"
            aria-label="Glassmorphism Style"
            title={`Glass Style: ${glassStyle.toUpperCase()}`}
          >
            <Layers className="w-3.5 h-3.5 text-[#007aff] dark:text-[#0a84ff]" />
            <span className="hidden sm:inline text-[11px] font-semibold capitalize">
              {glassStyle}
            </span>
          </button>

          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleAppearance}
            className="ios-btn-glass p-2 rounded-full text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white active:scale-95 cursor-pointer border border-black/5 dark:border-white/10"
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

          {/* Install Button if not yet installed */}
          {!pwa.isInstalled && (
            <button
              onClick={handleInstallClick}
              className="ios-btn-glass px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] flex items-center gap-1.5 active:scale-95 cursor-pointer border border-black/5 dark:border-white/10"
            >
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">{t("installApp")}</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="ios-btn-glass p-2 rounded-full text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white active:scale-95 cursor-pointer border border-black/5 dark:border-white/10"
            aria-label={t("settings")}
            title={t("settings")}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
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
    </header>
  );
};
