import React, { useState } from "react";
import { 
  Menu, 
  Bell, 
  Search, 
  X, 
  Sun, 
  Moon,
  Sparkles
} from "lucide-react";
import { AppSettings } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onHomeClick: () => void;
  onOpenSettings: () => void;
  onToggleDrawer: () => void;
  settings: AppSettings;
  pwa: PWAState;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onHomeClick,
  onOpenSettings,
  onToggleDrawer,
  settings,
}) => {
  const { appearance, toggleAppearance, t } = settings;
  const [hasNotifAlert, setHasNotifAlert] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#0c0c0f]/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/[0.08] transition-colors duration-250">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-15 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Drawer Toggle & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onToggleDrawer}
            className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-all duration-150 border border-zinc-200/80 dark:border-white/[0.08] cursor-pointer active:scale-95"
            aria-label="Buka Menu Samping"
            title="Menu Samping"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={onHomeClick}
            className="flex items-center gap-2 select-none cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-black font-extrabold flex items-center justify-center text-xs shadow-xs group-hover:scale-105 transition-transform duration-150">
              Fx
            </div>
            <span className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Fixio
            </span>
          </button>
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-1">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t("searchPlaceholder") || "Cari alat (TikTok, Remini, Gempa)..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 sm:py-2 bg-zinc-100/90 dark:bg-[#16161c] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5"
                aria-label="Hapus Pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleAppearance}
            className="w-8.5 h-8.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 border border-zinc-200/80 dark:border-white/[0.08] cursor-pointer active:scale-95"
            aria-label="Ubah Tema"
            title={`Tema: ${appearance}`}
          >
            {appearance === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            )}
          </button>

          {/* Notification Button */}
          <button
            onClick={() => setHasNotifAlert(!hasNotifAlert)}
            className="relative w-8.5 h-8.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 border border-zinc-200/80 dark:border-white/[0.08] cursor-pointer active:scale-95"
            aria-label="Notifikasi"
            title="Pembaruan & Status Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
          </button>

          {/* User Profile Avatar Pill */}
          <button
            onClick={onOpenSettings}
            className="w-8.5 h-8.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs border border-emerald-400/30 active:scale-95"
            aria-label="Pengaturan"
            title="Pengaturan Fixio"
          >
            F
          </button>
        </div>
      </div>
    </header>
  );
};
