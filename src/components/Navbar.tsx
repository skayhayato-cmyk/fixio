import React, { useState } from "react";
import { 
  Menu, 
  Bell, 
  Search, 
  X, 
  SlidersHorizontal,
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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hasNotifAlert, setHasNotifAlert] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d10]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-neutral-800/80 transition-colors">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Hamburger menu toggle button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleDrawer}
            className="w-9 h-9 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 text-white flex items-center justify-center transition border border-neutral-700/50 cursor-pointer active:scale-95"
            aria-label="Buka Menu Samping"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={onHomeClick}
            className="flex items-center gap-2 select-none cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#ffe600] text-black font-black flex items-center justify-center text-xs shadow-sm">
              Fx
            </div>
            <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              Fixio
            </span>
          </button>
        </div>

        {/* Center: Search Field (Compact on Mobile, Clean on Desktop) */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-1">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari alat (TikTok, Remini, Gempa)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#17171c] border border-neutral-800 focus:border-neutral-700 rounded-xl text-xs font-medium text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 text-neutral-400 hover:text-white"
                aria-label="Hapus Pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions (Notification & Avatar pill matching Screenshot_20261108-051355_7dae6052.jpg) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification bell icon button */}
          <button
            onClick={() => setHasNotifAlert(!hasNotifAlert)}
            className="relative w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Notifikasi"
            title="Pembaruan & Status Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ffe600] rounded-full" />
          </button>

          {/* User profile avatar pill (Green 'C' / 'F' avatar from screenshot) */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center transition cursor-pointer shadow-sm border border-emerald-400/30 active:scale-95"
            aria-label="Pengaturan Profil"
            title="Pengaturan Fixio"
          >
            F
          </button>
        </div>
      </div>
    </header>
  );
};
