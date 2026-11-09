import React from "react";
import { 
  Zap, 
  ArrowRight, 
  Sparkles, 
  Download, 
  Sliders, 
  Share2, 
  Activity
} from "lucide-react";
import { AppSettings } from "../services/useAppSettings";
import { PWAState } from "../services/usePWA";

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
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-amber-50/80 dark:bg-[#141418] border border-amber-300 dark:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden transition-colors duration-250">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Zap className="w-5 h-5 fill-amber-500" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Fixio Multi-Utility Engine
              </h2>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20">
                v{pwa.appVersion} • Ready
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-neutral-300 leading-relaxed">
              Semua alat praktis dalam satu tempat: TikTok & IG Downloader tanpa watermark, Remini & Wink HD AI, stalker akun Free Fire & Roblox, generator quotes WhatsApp, hingga info gempa BMKG real-time.
            </p>

            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={onOpenApp}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              >
                <span>Buka Dashboard Alat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {pwa.isInstallable && (
                <button
                  onClick={() => pwa.install()}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-zinc-800 dark:text-white text-xs font-bold transition flex items-center gap-1.5 border border-zinc-200 dark:border-neutral-700/80 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pasang Aplikasi</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Presentation Card */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-7 space-y-5 shadow-xs dark:shadow-xl transition-colors duration-250">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-neutral-800/80 pb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Pusat Layanan & Utilitas Digital
            </h1>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
              Pilih layanan untuk langsung memproses file, link, atau data tanpa login
            </p>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 text-zinc-700 dark:text-neutral-300 border border-zinc-200 dark:border-neutral-700/60 transition cursor-pointer"
            title="Pengaturan"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div 
            onClick={onOpenApp}
            className="bg-zinc-50 hover:bg-zinc-100/80 dark:bg-[#18181d] dark:hover:bg-[#202026] p-3.5 rounded-xl border border-zinc-200/80 dark:border-neutral-800/80 transition cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-pink-600 dark:group-hover:text-pink-300 transition">
                Social Media Downloader
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 block mt-0.5">
                TikTok No-WM, IG Video & Story, Spotify MP3
              </span>
            </div>
          </div>

          <div 
            onClick={onOpenApp}
            className="bg-zinc-50 hover:bg-zinc-100/80 dark:bg-[#18181d] dark:hover:bg-[#202026] p-3.5 rounded-xl border border-zinc-200/80 dark:border-neutral-800/80 transition cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-300 transition">
                AI Photo Enhancement
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 block mt-0.5">
                Remini Enhancer, Wink HD, Hapus Background
              </span>
            </div>
          </div>

          <div 
            onClick={onOpenApp}
            className="bg-zinc-50 hover:bg-zinc-100/80 dark:bg-[#18181d] dark:hover:bg-[#202026] p-3.5 rounded-xl border border-zinc-200/80 dark:border-neutral-800/80 transition cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block group-hover:text-rose-600 dark:group-hover:text-rose-300 transition">
                Stalker & Info Gempa
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 block mt-0.5">
                Free Fire, Roblox, dan Sensor Gempa BMKG
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Button */}
        <div className="pt-2">
          <button
            onClick={onOpenApp}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Mulai Gunakan Fixio Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
