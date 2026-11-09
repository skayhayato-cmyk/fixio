import React, { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AmbientBackground } from "./components/AmbientBackground";
import { CategoryFilter } from "./components/CategoryFilter";
import { ToolCard } from "./components/ToolCard";
import { InitialLanding } from "./components/InitialLanding";
import { SettingsModal } from "./components/SettingsModal";
import { SidebarDrawer } from "./components/SidebarDrawer";
import { TOOLS_LIST } from "./data/tools";
import { ToolCategory } from "./types";
import { usePWA } from "./services/usePWA";
import { useAppSettings } from "./services/useAppSettings";

// Tool Components
import { ReminiTool } from "./components/tools/ReminiTool";
import { ImgToPromptTool } from "./components/tools/ImgToPromptTool";
import { WinkHdTool } from "./components/tools/WinkHdTool";
import { RemoveBgTool } from "./components/tools/RemoveBgTool";
import { WebScreenshotTool } from "./components/tools/WebScreenshotTool";
import { InstagramStalkerTool } from "./components/tools/InstagramStalkerTool";
import { TikTokStalkerTool } from "./components/tools/TikTokStalkerTool";
import { FreeFireStalkerTool } from "./components/tools/FreeFireStalkerTool";
import { RobloxStalkerTool } from "./components/tools/RobloxStalkerTool";
import { QcWaTool } from "./components/tools/QcWaTool";
import { FakeCallTool } from "./components/tools/FakeCallTool";
import { BratvidTool } from "./components/tools/BratvidTool";
import { FakeFFTool } from "./components/tools/FakeFFTool";
import { IqcDarkTool } from "./components/tools/IqcDarkTool";
import { NokiaCanvasTool } from "./components/tools/NokiaCanvasTool";
import { WaifuPlayerTool } from "./components/tools/WaifuPlayerTool";
import { TtqcTool } from "./components/tools/TtqcTool";
import { InfoGempaTool } from "./components/tools/InfoGempaTool";
import { YtPlayTool } from "./components/tools/YtPlayTool";
import { StandaloneUploaderTool } from "./components/tools/StandaloneUploaderTool";
import { TikTokDownloaderTool } from "./components/tools/TikTokDownloaderTool";
import { TikTokDownloaderV2Tool } from "./components/tools/TikTokDownloaderV2Tool";
import { InstagramDownloaderTool } from "./components/tools/InstagramDownloaderTool";
import { InstagramDownloaderV2Tool } from "./components/tools/InstagramDownloaderV2Tool";
import { SpotifyDownloaderTool } from "./components/tools/SpotifyDownloaderTool";
import { StoryEditTool } from "./components/tools/StoryEditTool";
import { ToQrTool } from "./components/tools/ToQrTool";
import { AutoTraceTool } from "./components/tools/AutoTraceTool";
import { AmPresetTool } from "./components/tools/AmPresetTool";

import { 
  ChevronLeft, 
  Search, 
  WifiOff, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X
} from "lucide-react";

import { Variants } from "motion/react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 420,
      damping: 28,
    }
  },
};

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ytPlayerMounted, setYtPlayerMounted] = useState<boolean>(false);

  useEffect(() => {
    if (activeToolId === "yt-play") {
      setYtPlayerMounted(true);
    }
  }, [activeToolId]);

  const pwa = usePWA();
  const settings = useAppSettings();
  const { t, language } = settings;

  const categoryCounts = useMemo(() => {
    const counts: Record<ToolCategory, number> = {
      all: TOOLS_LIST.length,
      image: 0,
      social: 0,
      meme: 0,
      web: 0,
      info: 0,
      utility: 0,
    };
    TOOLS_LIST.forEach((t) => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      }
    });
    return counts;
  }, []);

  const filteredTools = useMemo(() => {
    return TOOLS_LIST.filter((tool) => {
      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        (tool.badge && tool.badge.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeTool = useMemo(() => {
    return TOOLS_LIST.find((t) => t.id === activeToolId) || null;
  }, [activeToolId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeToolId, hasEnteredApp]);

  const renderActiveToolComponent = () => {
    switch (activeToolId) {
      case "imgtopromt":
        return <ImgToPromptTool />;
      case "remini":
        return <ReminiTool />;
      case "wink-hd":
        return <WinkHdTool />;
      case "remove-bg":
        return <RemoveBgTool />;
      case "ss-web":
        return <WebScreenshotTool />;
      case "ig-stalker":
        return <InstagramStalkerTool />;
      case "ff-stalker":
        return <FreeFireStalkerTool />;
      case "roblox-stalker":
        return <RobloxStalkerTool />;
      case "tiktok-stalker":
        return <TikTokStalkerTool />;
      case "tiktok-dl":
        return <TikTokDownloaderTool />;
      case "tiktok-dl-v2":
        return <TikTokDownloaderV2Tool />;
      case "ig-dl":
        return <InstagramDownloaderTool />;
      case "ig-dl-v2":
        return <InstagramDownloaderV2Tool />;
      case "spotify-dl":
        return <SpotifyDownloaderTool />;
      case "qcwa":
        return <QcWaTool />;
      case "fake-call":
        return <FakeCallTool />;
      case "bratvid":
        return <BratvidTool />;
      case "story-edit":
        return <StoryEditTool />;
      case "fake-ff":
        return <FakeFFTool />;
      case "iqc-dark":
        return <IqcDarkTool />;
      case "nokia-canvas":
        return <NokiaCanvasTool />;
      case "waifu-player":
        return <WaifuPlayerTool />;
      case "ttqc":
        return <TtqcTool />;
      case "info-gempa":
        return <InfoGempaTool />;
      case "yt-play":
        return null;
      case "uploader":
        return <StandaloneUploaderTool onSelectTool={(id) => setActiveToolId(id)} />;
      case "to-qr":
        return <ToQrTool onSelectTool={(id) => setActiveToolId(id)} />;
      case "auto-trace":
        return <AutoTraceTool />;
      case "ampreset":
        return <AmPresetTool />;
      default:
        return null;
    }
  };

  const isLandingView = !hasEnteredApp && !activeToolId;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 transition-colors duration-250 ease-out overflow-x-hidden max-w-full">
      <AmbientBackground />

      {/* Slide-over Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveToolId(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onGoHome={() => {
          setActiveToolId(null);
          setSelectedCategory("all");
          setSearchQuery("");
        }}
        onOpenYtPlayer={() => {
          setHasEnteredApp(true);
          setActiveToolId("yt-play");
        }}
        settings={settings}
      />

      {isLandingView ? (
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <InitialLanding
            onOpenApp={() => setHasEnteredApp(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            settings={settings}
            pwa={pwa}
          />
        </div>
      ) : (
        <>
          {/* Top Modern Navbar */}
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onHomeClick={() => {
              setActiveToolId(null);
              setSelectedCategory("all");
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleDrawer={() => setIsDrawerOpen(true)}
            settings={settings}
            pwa={pwa}
          />

          <div className="relative z-10 flex flex-col flex-1 max-w-full overflow-x-hidden">
            <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
              <AnimatePresence mode="wait">
                {activeTool ? (
                  /* Active Tool View with smooth transition */
                  <motion.div 
                    key={activeTool.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    {/* Top Bar with Back Navigation */}
                    <div className="flex items-center justify-between gap-3">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActiveToolId(null)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#141416] hover:bg-zinc-100 dark:hover:bg-[#1c1c20] border border-zinc-200 dark:border-white/[0.08] rounded-xl text-xs font-bold text-zinc-800 dark:text-neutral-200 transition cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{t("allTools")}</span>
                      </motion.button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-neutral-200 bg-white dark:bg-[#141416] px-3 py-1 rounded-xl border border-zinc-200 dark:border-white/[0.08] shadow-2xs">
                          {activeTool.title}
                        </span>
                      </div>
                    </div>

                    {/* Tool Surface (Rounded, clean border, zero horizontal overflow) */}
                    <div className="bg-white dark:bg-[#121215] p-4 sm:p-6 rounded-2xl border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-xl overflow-hidden w-full max-w-full">
                      {renderActiveToolComponent()}
                    </div>
                  </motion.div>
                ) : (
                  /* Main Tools Dashboard View */
                  <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-3.5 sm:space-y-4"
                  >
                    {/* 1. Status / Balance Banner (Screenshot 1 Authentic Match) */}
                    <div className="bg-amber-500/10 dark:bg-[#1b1509] border border-amber-500/30 dark:border-amber-500/35 rounded-2xl p-4 sm:p-4.5 shadow-2xs relative overflow-hidden">
                      <div className="flex items-start gap-3">
                        <div className="text-amber-500 shrink-0 mt-0.5">
                          <AlertTriangle className="w-5 h-5 fill-amber-500/20" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-amber-100 tracking-tight">
                            Layanan Fixio Multi-Utility (Bebas Biaya)
                          </h2>
                          <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-amber-200/70 leading-relaxed">
                            Semua 28+ alat aktif dan siap digunakan langsung tanpa registrasi, saldo, atau kuota token.
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const el = document.getElementById("search-input-field");
                                if (el) el.focus();
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-white text-black text-xs font-bold shadow-xs hover:bg-neutral-100 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Mulai Gunakan Alat</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Order/Workflow Step Card (Screenshot 1 Authentic Match) */}
                    <div className="bg-white dark:bg-[#141416] border border-zinc-200/90 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Pusat Media & Pemroses Otomatis
                          </h2>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Pilih layanan di bawah untuk unduh video tanpa watermark, tingkatkan foto HD, atau stalking profil game.
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-200/80 dark:border-white/10">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Real-time
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          28 Server Aktif
                        </span>
                      </div>

                      {/* Step Indicator (Screenshot 1 Style) */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        <span className="text-zinc-900 dark:text-white font-bold flex items-center gap-1 shrink-0">
                          <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold flex items-center justify-center">1</span>
                          Pilih Alat
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">/</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] flex items-center justify-center">2</span>
                          Tempel Link/Input
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">/</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] flex items-center justify-center">3</span>
                          Proses Cepat
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">/</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] flex items-center justify-center">4</span>
                          Unduh Hasil
                        </span>
                      </div>

                      {/* Guarantee note */}
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kualitas asli tanpa watermark, jernih HD, dan gratis selamanya</span>
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="flex items-center justify-between pt-1">
                      <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                        <span className="text-amber-500">::</span>
                        <span>{selectedCategory === "all" ? "Layanan Populer" : `Kategori: ${selectedCategory.toUpperCase()}`}</span>
                      </h2>

                      <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                        {filteredTools.length} Layanan
                      </span>
                    </div>

                    {/* 2-Column Responsive Tool Grid with Spring Staggering */}
                    {filteredTools.length > 0 ? (
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-full"
                      >
                        {filteredTools.map((tool) => (
                          <motion.div key={tool.id} variants={itemVariants} layout>
                            <ToolCard
                              tool={tool}
                              onSelect={(id) => setActiveToolId(id)}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      /* Clean Empty State */
                      <div className="bg-white dark:bg-[#141416] rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-8 sm:p-10 text-center space-y-3">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                          {language === "id" ? "Tidak ada layanan yang sesuai" : "No utilities found"}
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold cursor-pointer transition"
                        >
                          {language === "id" ? "Reset Pencarian" : "Reset Search"}
                        </button>
                      </div>
                    )}

                    {/* Bottom Search Bar & Quick Categories (Screenshot 1 Authentic Match) */}
                    <div className="space-y-2 pt-3 pb-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="search-input-field"
                          type="text"
                          placeholder="Cari layanan..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-24 py-2.5 bg-white dark:bg-[#141416] border border-zinc-200/90 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-amber-400 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all shadow-2xs"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span>{TOOLS_LIST.length} layanan</span>
                        </div>
                      </div>

                      {/* Category Pills Bar */}
                      <CategoryFilter
                        activeCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        counts={categoryCounts}
                        settings={settings}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Footer */}
            <Footer
              onOpenSettings={() => setIsSettingsOpen(true)}
              language={language}
            />
          </div>
        </>
      )}

      {/* Persistent YtPlay Background Player */}
      {ytPlayerMounted && (
        <YtPlayTool
          onBack={() => setActiveToolId(null)}
          isMinimized={activeToolId !== "yt-play"}
          onMaximize={() => {
            setHasEnteredApp(true);
            setActiveToolId("yt-play");
          }}
          onClosePlayer={() => {
            setYtPlayerMounted(false);
            if (activeToolId === "yt-play") setActiveToolId(null);
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        pwa={pwa}
      />

      {/* Offline Toast */}
      {!pwa.isOnline && (
        <div
          className="fixed bottom-4 inset-x-4 sm:inset-x-0 sm:mx-auto sm:w-fit z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 dark:bg-[#27272a] text-white text-xs font-medium shadow-lg border border-zinc-700"
          title={t("noInternetDesc")}
        >
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t("noInternetTitle")}</span>
        </div>
      )}
    </div>
  );
}
