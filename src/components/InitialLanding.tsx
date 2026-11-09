import React, { useState } from "react";
import { Settings as SettingsIcon, Download, ArrowRight, Sun, Moon, Monitor, Zap } from "lucide-react";
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
    <div className="min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 py-8 sm:py-12 max-w-xl mx-auto select-none">
      {/* Top controls bar */}
      <div className="w-full flex items-center justify-between">
        {/* Brutalist Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#ffe600] text-black border-2 border-[#0a0a0a] shadow-[2px_2px_0px_0px_#0a0a0a] text-xs font-black uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-black" />
          <span>Fixio Hub v{pwa.appVersion}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleAppearance}
            className="bru-btn p-2.5 border-2 border-[#0a0a0a] dark:border-[#f5f5f0] bg-white dark:bg-[#17171a] shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#ffe600] hover:bg-[#ffe600] hover:text-black active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
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

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="bru-btn p-2.5 border-2 border-[#0a0a0a] dark:border-[#f5f5f0] bg-white dark:bg-[#17171a] shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#ffe600] hover:bg-[#ffe600] hover:text-black active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            aria-label={t("settings")}
            title={t("settings")}
          >
            <SettingsIcon className="w-4 h-4 text-black dark:text-white" />
          </button>
        </div>
      </div>

      {/* Main Brutalist Center Card */}
      <div className="w-full my-auto py-8">
        <div className="bg-white dark:bg-[#17171a] border-3 border-[#0a0a0a] dark:border-[#f5f5f0] shadow-[6px_6px_0px_0px_#0a0a0a] dark:shadow-[6px_6px_0px_0px_#ffe600] p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* Transparent Logo */}
            <Logo size="xl" animate />

            <h1 className="sr-only">Fixio Multi-Utility Engine</h1>

            <div className="bg-[#f4f4f0] dark:bg-[#222226] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] p-4 w-full text-center">
              <p className="text-sm sm:text-base text-[#0a0a0a] dark:text-[#f5f5f0] font-bold tracking-tight min-h-[2.5em] flex items-center justify-center leading-relaxed">
                <TypewriterText key={language} text={t("landingDescription")} />
              </p>
            </div>
          </div>

          {/* Brutalist Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full">
            {/* Open App */}
            <button
              onClick={onOpenApp}
              className="w-full py-3.5 px-6 bg-[#ffe600] text-black border-2 border-[#0a0a0a] dark:border-[#0a0a0a] text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#0a0a0a] dark:shadow-[4px_4px_0px_0px_#f5f5f0] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#0a0a0a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0a0a0a] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t("openApp")}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Install App (if not installed) */}
            {!pwa.isInstalled && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 bg-white dark:bg-[#222226] text-black dark:text-white border-2 border-[#0a0a0a] dark:border-[#f5f5f0] text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#0a0a0a] dark:shadow-[4px_4px_0px_0px_#ffe600] hover:bg-[#ffe600] hover:text-black hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                <span>{t("installApp")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full flex items-center justify-between text-xs font-bold text-[#555550] dark:text-[#9e9e98] pt-4 border-t-2 border-[#0a0a0a]/20 dark:border-[#f5f5f0]/20">
        <span className="uppercase">FIXIO CORE UTILITIES</span>
        <button
          onClick={onOpenSettings}
          className="hover:text-black dark:hover:text-[#ffe600] underline underline-offset-4 cursor-pointer"
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
