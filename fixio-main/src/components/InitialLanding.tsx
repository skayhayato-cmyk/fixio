import React, { useState } from "react";
import { Settings as SettingsIcon, Download, ArrowRight, Sun, Moon, Monitor, ImageUp, Film, QrCode, Zap } from "lucide-react";
import { Logo } from "./Logo";
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
      if (!accepted) setShowInstallGuide(true);
    } else {
      setShowInstallGuide(true);
    }
  };

  const ThemeIcon = appearance === "dark" ? Sun : appearance === "light" ? Moon : Monitor;
  const isId = language === "id";

  const features = [
    { icon: ImageUp, label: "HD & AI" },
    { icon: Film, label: isId ? "Unduh" : "Download" },
    { icon: QrCode, label: "QR" },
    { icon: Zap, label: isId ? "Cepat" : "Fast" },
  ];

  return (
    <div className="min-h-screen flex flex-col px-5 py-6 max-w-lg mx-auto select-none">
      {/* Bar atas */}
      <div className="flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAppearance}
            className="bru-btn w-10 h-10"
            aria-label={t("appearance")}
            title={`${t("appearance")}: ${appearance}`}
          >
            <ThemeIcon className="w-4 h-4" strokeWidth={2.5} />
          </button>
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

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center gap-7 py-10">
        <h1 className="bru-title text-[clamp(3.5rem,18vw,6rem)] leading-[0.9]">
          {isId ? "Semua" : "Every"}
          <br />
          {isId ? "alat," : "tool,"}
          <br />
          <span className="inline-block bg-[var(--bru-accent)] text-[#0a0a0a] px-2 -ml-1 border-2 border-[var(--bru-ink)]">
            {isId ? "satu tempat." : "one place."}
          </span>
        </h1>

        <div className="grid grid-cols-4 gap-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="bru-box !shadow-none py-3 flex flex-col items-center gap-1.5">
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[11px] font-bold">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onOpenApp}
            className="bru-btn bru-btn-accent w-full py-4 text-base"
          >
            <span>{t("openApp")}</span>
            <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </button>

          {!pwa.isInstalled && (
            <button onClick={handleInstallClick} className="bru-btn w-full py-3.5 text-sm">
              <Download className="w-4 h-4" strokeWidth={2.5} />
              <span>{t("installApp")}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-bold border-t-2 border-[var(--bru-line)] pt-3">
        <span>v{pwa.appVersion}</span>
        <span>NexaDev</span>
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
  );
};
