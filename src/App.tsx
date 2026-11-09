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
  LayoutGrid, 
  Zap, 
  Sparkles
} from "lucide-react";

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
    <div className="min-h-screen flex flex-col text-neutral-100 bg-[#09090b] transition-colors duration-200 overflow-x-hidden max-w-full">
      <AmbientBackground />

      {/* Modern Slide-over Sidebar Drawer */}
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
          {/* Top Modern Dashboard Navbar */}
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
            <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
              <AnimatePresence mode="wait">
                {activeTool ? (
                  /* Active Tool View with smooth transition */
                  <motion.div 
                    key={activeTool.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    {/* Top Bar with Back Navigation */}
                    <div className="flex items-center justify-between gap-3">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActiveToolId(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141418] hover:bg-[#1a1a20] border border-neutral-800 rounded-xl text-xs font-bold text-neutral-200 hover:text-white transition cursor-pointer shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{t("allTools")}</span>
                      </motion.button>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-neutral-300 bg-[#16161b] px-2.5 py-1 rounded-lg border border-neutral-800">
                          {activeTool.title}
                        </span>
                      </div>
                    </div>

                    {/* Tool Surface (Rounded, clean border, zero horizontal overflow) */}
                    <div className="bg-[#121215] p-4 sm:p-6 rounded-2xl border border-neutral-800/80 shadow-xl overflow-hidden w-full max-w-full">
                      {renderActiveToolComponent()}
                    </div>
                  </motion.div>
                ) : (
                  /* Main Tools Dashboard View with smooth transition */
                  <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Alert/Status Banner matching Screenshot_20261108-051355_7dae6052.jpg */}
                    <div className="bg-[#141418] border border-amber-500/35 rounded-2xl p-4 sm:p-4.5 shadow-sm relative overflow-hidden">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="w-4 h-4 fill-amber-400" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                              Fixio Multi-Utility Engine • 28+ Alat
                            </h2>
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Aktif
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed">
                            Download media, AI enhance foto, cek akun game, dan sensor gempa BMKG langsung tanpa antre.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section Title with Icon */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-[#ffe600]" />
                        <h2 className="text-sm font-extrabold text-white tracking-tight">
                          {selectedCategory === "all" ? "Layanan Populer" : `Kategori: ${selectedCategory.toUpperCase()}`}
                        </h2>
                      </div>

                      <span className="text-xs font-semibold text-neutral-400">
                        {filteredTools.length} Layanan
                      </span>
                    </div>

                    {/* Horizontal Category Pill Filter Bar */}
                    <CategoryFilter
                      activeCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                      counts={categoryCounts}
                      settings={settings}
                    />

                    {/* 2-Column Responsive Tool Grid (Clean, rounded, no overflow) */}
                    {filteredTools.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-full">
                        {filteredTools.map((tool) => (
                          <ToolCard
                            key={tool.id}
                            tool={tool}
                            onSelect={(id) => setActiveToolId(id)}
                          />
                        ))}
                      </div>
                    ) : (
                      /* Clean Empty State */
                      <div className="bg-[#141418] rounded-2xl border border-neutral-800 p-8 sm:p-10 text-center space-y-3">
                        <div className="w-10 h-10 bg-neutral-800 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-white">
                          {language === "id" ? "Tidak ada alat yang cocok" : "No utilities found"}
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 cursor-pointer transition"
                        >
                          {language === "id" ? "Reset Pencarian" : "Reset Search"}
                        </button>
                      </div>
                    )}
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
          className="fixed bottom-4 inset-x-4 sm:inset-x-0 sm:mx-auto sm:w-fit z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#27272a] text-white text-xs font-medium shadow-lg border border-neutral-700"
          title={t("noInternetDesc")}
        >
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t("noInternetTitle")}</span>
        </div>
      )}
    </div>
  );
}
