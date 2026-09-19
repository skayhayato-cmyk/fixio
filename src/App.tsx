import React, { useState, useMemo, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { AmbientBackground } from "./components/AmbientBackground";
import { CategoryFilter } from "./components/CategoryFilter";
import { ToolCard } from "./components/ToolCard";
import { InitialLanding } from "./components/InitialLanding";
import { SettingsModal } from "./components/SettingsModal";
import { TOOLS_LIST } from "./data/tools";
import { ToolCategory } from "./types";
import { usePWA } from "./services/usePWA";
import { useAppSettings } from "./services/useAppSettings";

// Tool Components
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

import { 
  ChevronLeft, 
  Search, 
  WifiOff
} from "lucide-react";

export default function App() {
  // Navigation states: 'landing' (pristine initial screen), 'tools' (clean tool catalog), or direct tool id
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Custom Hooks for PWA and Settings
  const pwa = usePWA();
  const settings = useAppSettings();
  const { t, language } = settings;

  // Category counts
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

  // Filtered tools
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

  // Scroll to top when changing tool or view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeToolId, hasEnteredApp]);

  // When activeToolId is "yt-play"
  if (activeToolId === "yt-play") {
    return (
      <>
        <YtPlayTool onBack={() => setActiveToolId(null)} />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          pwa={pwa}
        />
      </>
    );
  }

  const renderActiveToolComponent = () => {
    switch (activeToolId) {
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
        return <YtPlayTool onBack={() => setActiveToolId(null)} />;
      case "uploader":
        return <StandaloneUploaderTool onSelectTool={(id) => setActiveToolId(id)} />;
      default:
        return null;
    }
  };

  // 1. Initial Pristine Landing Screen
  if (!hasEnteredApp && !activeToolId) {
    return (
      <div className="min-h-screen text-black dark:text-white transition-colors duration-200">
        <AmbientBackground />

        <div className="relative z-10">
          <InitialLanding
            onOpenApp={() => setHasEnteredApp(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            settings={settings}
            pwa={pwa}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            pwa={pwa}
          />

          {/* No-Internet Pill indicator — Fixio is online-only, every tool
              calls a live API, so this warns the user rather than implying
              the app still works offline. */}
          {!pwa.isOnline && (
            <div
              className="fixed bottom-4 inset-x-4 sm:inset-x-0 sm:mx-auto sm:w-fit z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#3a3a3c] text-white text-xs font-medium shadow-md"
              title={t("noInternetDesc")}
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t("noInternetTitle")}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Main App Screen (Tools Catalog or Active Tool)
  return (
    <div className="min-h-screen flex flex-col text-black dark:text-white transition-colors duration-200">
      <AmbientBackground />

      {/* iOS Minimal Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onHomeClick={() => {
          setActiveToolId(null);
          setHasEnteredApp(false);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        pwa={pwa}
      />

      {/* Content sits in its own stacking context above the fixed
          ambient backdrop (position:fixed layers paint above static
          content otherwise, hiding the page behind the blobs) */}
      <div className="relative z-10 flex flex-col flex-1">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTool ? (
          /* Active Tool Screen */
          <div className="space-y-4 animate-ios-fade">
            {/* Minimal iOS Back Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveToolId(null)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 transition cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t("allTools")}</span>
              </button>

              <span className="text-xs text-[#8e8e93] dark:text-[#98989d] uppercase font-semibold tracking-wider">
                {activeTool.category}
              </span>
            </div>

            {/* Tool Container */}
            <div className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-7 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs">
              {renderActiveToolComponent()}
            </div>
          </div>
        ) : (
          /* Tools Catalog Grid */
          <div className="space-y-6 animate-ios-fade">
            {/* Minimal Segmented Category Tabs */}
            <CategoryFilter
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              counts={categoryCounts}
              settings={settings}
            />

            {/* Tools Grid (2 columns on tablet/desktop, 1 on mobile) */}
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onSelect={(id) => setActiveToolId(id)}
                  />
                ))}
              </div>
            ) : (
              /* Minimal Empty State */
              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 p-10 text-center space-y-3">
                <div className="w-10 h-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#8e8e93] rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-black dark:text-white">
                  {language === "id" ? "Tidak ada alat yang cocok" : "No utilities found"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="text-xs text-[#007aff] dark:text-[#0a84ff] font-semibold hover:underline cursor-pointer"
                >
                  {language === "id" ? "Tampilkan Semua Alat" : "Show All Tools"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Minimal iOS Footer */}
      <Footer
        onOpenSettings={() => setIsSettingsOpen(true)}
        language={language}
      />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        pwa={pwa}
      />

      {/* No-Internet Toast — shown whenever connectivity drops, since every
          tool call depends on the live API and will fail without it. */}
      {!pwa.isOnline && (
        <div
          className="fixed bottom-4 inset-x-4 sm:inset-x-0 sm:mx-auto sm:w-fit z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#3a3a3c] text-white text-xs font-medium shadow-md"
          title={t("noInternetDesc")}
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t("noInternetTitle")}</span>
        </div>
      )}
    </div>
  );
}
