import React from "react";
import { 
  X, 
  LayoutGrid, 
  Sparkles, 
  Music, 
  Sliders, 
  Image as ImageIcon, 
  Share2, 
  MessageSquare, 
  Globe, 
  Activity, 
  UploadCloud, 
  ExternalLink, 
  Zap, 
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck
} from "lucide-react";
import { AppSettings, AppearanceMode, LanguageCode } from "../services/useAppSettings";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container (Exactly styled like Screenshot_20261108-051400_d951bc1f.jpg) */}
      <aside className="relative w-full max-w-[310px] sm:max-w-xs bg-[#111114] text-neutral-100 h-full border-r border-neutral-800/80 shadow-2xl flex flex-col justify-between overflow-y-auto no-scrollbar z-10 animate-in slide-in-from-left duration-250 ease-out">
        {/* Top Header */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Brand & Close */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ffe600] text-black font-black flex items-center justify-center text-sm shadow-sm">
                Fx
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Fixio Hub
                </h2>
                <p className="text-[10px] text-neutral-400 font-medium">Multi-Utility Platform</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card (like in screenshot) */}
          <div className="bg-[#18181d] rounded-xl p-3 border border-neutral-800/80 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                F
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  Fixio User
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-2.5 h-2.5" /> FREE
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
              title="Pengaturan"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Status Quick Pill */}
          <div 
            onClick={() => {
              onClose();
              onSelectCategory("all");
            }}
            className="bg-[#18181d] hover:bg-[#202026] rounded-xl px-3.5 py-2.5 border border-neutral-800/80 flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
              <Zap className="w-4 h-4 text-[#ffe600]" />
              <span>28+ Alat Aktif</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>

          {/* Section: MENU UTAMA */}
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 px-1 block">
              Menu Utama
            </span>

            <button
              onClick={() => {
                onClose();
                onGoHome();
                onSelectCategory("all");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeCategory === "all"
                  ? "bg-[#25252b] text-white"
                  : "text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-[#ffe600]" />
              <span>Dashboard / Beranda</span>
            </button>

            {onOpenYtPlayer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenYtPlayer();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-800/50 hover:text-white transition"
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-800/50 hover:text-white transition"
            >
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>{t("settingsTitle")}</span>
            </button>
          </div>

          {/* Section: KATEGORI ALAT */}
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 px-1 block">
              Kategori Layanan
            </span>

            {[
              { id: "image", label: "Gambar & AI", icon: ImageIcon, color: "text-purple-400" },
              { id: "social", label: "Media Sosial (DL & Stalk)", icon: Share2, color: "text-pink-400" },
              { id: "meme", label: "Quotes & Meme", icon: MessageSquare, color: "text-amber-400" },
              { id: "web", label: "Web Screenshot Multi-Device", icon: Globe, color: "text-blue-400" },
              { id: "info", label: "Gempa Bumi Terkini (BMKG)", icon: Activity, color: "text-rose-400" },
              { id: "utility", label: "Utilitas & Generator", icon: UploadCloud, color: "text-emerald-400" },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onClose();
                    onSelectCategory(cat.id as ToolCategory);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#25252b] text-white"
                      : "text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${cat.color}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Preferences Card (like in Screenshot_20261108-051400_d951bc1f.jpg) */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#141418] space-y-3">
          {/* Bahasa row */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Bahasa</span>
            <div className="inline-flex bg-[#1e1e24] p-0.5 rounded-lg border border-neutral-700/60">
              <button
                onClick={() => setLanguage("id")}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  language === "id"
                    ? "bg-[#ffe600] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  language === "en"
                    ? "bg-[#ffe600] text-black shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          {/* Tampilan Dark Mode Switch */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/60">
            <span className="text-neutral-400 font-medium">Tampilan</span>
            <button
              onClick={toggleAppearance}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1e1e24] border border-neutral-700/60 text-[11px] font-bold text-white hover:bg-neutral-800 transition"
            >
              {appearance === "dark" ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {/* FollowMe row */}
          <a
            href="https://api.nexadev.my.id"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between pt-1 text-[11px] text-neutral-400 hover:text-white border-t border-neutral-800/60 transition group"
          >
            <div>
              <span className="font-semibold block text-neutral-200">FollowMe</span>
              <span className="text-[10px] text-neutral-500">API resmi Fixio Engine</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </aside>
    </div>
  );
};
