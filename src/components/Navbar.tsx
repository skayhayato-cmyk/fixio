import React, { useState } from "react";
import { Search, Settings as SettingsIcon, Download, X, Sun, Moon, Monitor } from "lucide-react";
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
  const { t, language, appearance, toggleAppearance } = settings;
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
    <header className="sticky top-0 z-40 bg-[#f4f4f0] dark:bg-[#0d0d0f] border-b-3 border-[#0a0a0a] dark:border-[#f5f5f0] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <Logo size="sm" onClick={onHomeClick} />

        {/* Brutalist Search Field */}
        <div className="flex-1 max-w-xs sm:max-w-sm mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-black dark:text-white absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#17171a] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] rounded-none text-xs font-bold text-[#0a0a0a] dark:text-[#f5f5f0] placeholder-[#555550] dark:placeholder-[#9e9e98] shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#ffe600] focus:outline-none focus:translate-x-0.5 focus:translate-y-0.5"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 text-black dark:text-white hover:bg-[#ffe600] hover:text-black p-0.5 border border-black dark:border-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleAppearance}
            className="bru-btn p-2 border-2 border-black dark:border-white bg-white dark:bg-[#17171a] shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#ffe600] hover:bg-[#ffe600] hover:text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            aria-label={t("appearance")}
            title={`${t("appearance")}: ${appearance}`}
          >
            {appearance === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
            ) : appearance === "light" ? (
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600" />
            ) : (
              <Monitor className="w-4 h-4 text-black dark:text-white" />
            )}
          </button>

          {/* Install Button if not yet installed */}
          {!pwa.isInstalled && (
            <button
              onClick={handleInstallClick}
              className="bru-btn-accent px-3 py-1.5 text-xs font-black uppercase text-black bg-[#ffe600] border-2 border-black shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#f5f5f0] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden md:inline">{t("installApp")}</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="bru-btn p-2 border-2 border-black dark:border-white bg-white dark:bg-[#17171a] shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#ffe600] hover:bg-[#ffe600] hover:text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            aria-label={t("settings")}
            title={t("settings")}
          >
            <SettingsIcon className="w-4 h-4 text-black dark:text-white" />
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
