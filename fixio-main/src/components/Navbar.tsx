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
      if (!accepted) setShowInstallGuide(true);
    } else {
      setShowInstallGuide(true);
    }
  };

  const ThemeIcon = appearance === "dark" ? Sun : appearance === "light" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-40 bru-header">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2.5">
        <Logo size="sm" onClick={onHomeClick} />

        {/* Pencarian */}
        <div className="flex-1 min-w-0 relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 pointer-events-none" strokeWidth={2.5} />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm font-semibold placeholder:font-medium placeholder:text-[var(--bru-muted)] bg-[var(--bru-surface)] border-2 border-[var(--bru-line)] rounded-none focus:outline-none focus:bg-[var(--bru-accent)] focus:text-[#0a0a0a]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Aksi: hanya ikon */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleAppearance}
            className="bru-btn w-10 h-10"
            aria-label={t("appearance")}
            title={`${t("appearance")}: ${appearance}`}
          >
            <ThemeIcon className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {!pwa.isInstalled && (
            <button
              onClick={handleInstallClick}
              className="bru-btn bru-btn-accent w-10 h-10"
              aria-label={t("installApp")}
              title={t("installApp")}
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="bru-btn w-10 h-10"
            aria-label={t("settings")}
            title={t("settings")}
          >
            <SettingsIcon className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

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
