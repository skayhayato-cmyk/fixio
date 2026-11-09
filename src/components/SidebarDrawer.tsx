import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  X, 
  LayoutGrid, 
  Music, 
  Sliders, 
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
  LogOut
} from "lucide-react";
import { AppSettings } from "../services/useAppSettings";
import { ToolCategory } from "../types";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
  onOpenYtPlayer?: () => void;
  settings: AppSettings;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  onOpenSettings,
  onGoHome,
  onOpenYtPlayer,
  settings,
}) => {
  const { language, setLanguage, appearance, toggleAppearance, t } = settings;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with smooth motion fade */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs"
          />

          {/* Drawer Container with spring slide-in */}
          <motion.aside 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="relative w-full max-w-[285px] sm:max-w-xs bg-white dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 h-full border-r border-zinc-200 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar z-10 transition-colors duration-200"
          >
            {/* Top Content */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Brand & Close */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-extrabold flex items-center justify-center text-sm shadow-xs">
                    Fx
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold tracking-tight text-zinc-900 dark:text-white">
                      Fixio Engine
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-medium">Multi-Utility Dashboard</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card (Screenshot Match) */}
              <div className="bg-zinc-50 dark:bg-[#17171c] rounded-2xl p-3 border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs border border-emerald-400/30">
                    F
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block truncate">
                      Fixio Member
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      <ShieldCheck className="w-2.5 h-2.5" /> FREE ACCESS
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                  title="Keluar / Pengaturan"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status / Balance Quick Card */}
              <button 
                onClick={() => {
                  onClose();
                  onSelectCategory("all");
                }}
                className="w-full bg-zinc-50 hover:bg-zinc-100 dark:bg-[#17171c] dark:hover:bg-[#1d1d23] rounded-2xl px-3.5 py-2.5 border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between cursor-pointer transition text-left"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-neutral-200">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>28 Layanan Aktif (Siap Pakai)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-neutral-500" />
              </button>

              {/* Section: MENU UTAMA */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1 block">
                  Menu Utama
                </span>

                <button
                  onClick={() => {
                    onClose();
                    onGoHome();
                    onSelectCategory("all");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeCategory === "all"
                      ? "bg-zinc-100 text-zinc-950 dark:bg-[#202026] dark:text-white font-bold"
                      : "text-zinc-600 dark:text-neutral-300 hover:bg-zinc-100/70 dark:hover:bg-neutral-800/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-amber-500" />
                  <span>Dashboard Layanan</span>
                </button>

                {onOpenYtPlayer && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenYtPlayer();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-neutral-300 hover:bg-zinc-100/70 dark:hover:bg-neutral-800/50 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-rose-500" />
                    <span>YouTube Background Player</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-neutral-300 hover:bg-zinc-100/70 dark:hover:bg-neutral-800/50 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-sky-500" />
                  <span>{t("settingsTitle")}</span>
                </button>
              </div>

              {/* Section: KATEGORI ALAT (Clean, No Icon Clutter) */}
              <div className="space-y-0.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1 block">
                  Kategori
                </span>

                {[
                  { id: "social", label: "Media Sosial (DL & Stalker)" },
                  { id: "image", label: "AI Enhancer & Foto HD" },
                  { id: "meme", label: "Quotes WhatsApp & Meme" },
                  { id: "web", label: "Web Screenshot Multi-Device" },
                  { id: "info", label: "Info Gempa Bumi BMKG" },
                  { id: "utility", label: "Utilitas & Generator QR" },
                ].map((cat) => {
                  const isActive = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onClose();
                        onSelectCategory(cat.id as ToolCategory);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? "bg-zinc-100 text-zinc-950 dark:bg-[#202026] dark:text-white font-bold"
                          : "text-zinc-500 dark:text-neutral-400 hover:bg-zinc-100/60 dark:hover:bg-neutral-800/40 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-neutral-600" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Card (Screenshot Match) */}
            <div className="p-4 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0c0c0f] space-y-3">
              {/* Bahasa */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-neutral-400 font-medium">Bahasa</span>
                <div className="inline-flex bg-zinc-200/80 dark:bg-[#16161c] p-0.5 rounded-lg border border-zinc-300/60 dark:border-neutral-700/60">
                  <button
                    onClick={() => setLanguage("id")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      language === "id"
                        ? "bg-amber-500 text-black shadow-xs"
                        : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    🇮🇩 ID
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                      language === "en"
                        ? "bg-amber-500 text-black shadow-xs"
                        : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    🇬🇧 EN
                  </button>
                </div>
              </div>

              {/* Tampilan Dark Mode Switch */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/80 dark:border-neutral-800/60">
                <span className="text-zinc-500 dark:text-neutral-400 font-medium">Tampilan</span>
                <button
                  onClick={toggleAppearance}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-[#16161c] border border-zinc-300/60 dark:border-neutral-700/60 text-[11px] font-bold text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  {appearance === "dark" ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Light</span>
                    </>
                  )}
                </button>
              </div>

              {/* FollowMe */}
              <a
                href="https://api.nexadev.my.id"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white border-t border-zinc-200/80 dark:border-neutral-800/60 transition group"
              >
                <div>
                  <span className="font-semibold block text-zinc-800 dark:text-neutral-200">FollowMe</span>
                  <span className="text-[10px] text-zinc-400 dark:text-neutral-500">API resmi Fixio Engine</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
