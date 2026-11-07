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

import { ArrowLeft, SearchX, WifiOff, RotateCcw } from "lucide-react";

export default function App() {
  // Navigation states: 'landing' (pristine initial screen), 'tools' (clean tool catalog), or direct tool id
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ytPlayerMounted, setYtPlayerMounted] = useState<boolean>(false);

  // Automatically mount persistent background player when user opens yt-play
  useEffect(() => {
    if (activeToolId === "yt-play") {
      setYtPlayerMounted(true);
    }
  }, [activeToolId]);

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

  // Unified Layout (Landing Screen or Main App View)
  const isLandingView = !hasEnteredApp && !activeToolId;

  return (
    <div className="min-h-screen flex flex-col">
      <AmbientBackground />

      {isLandingView ? (
        /* 1. Initial Pristine Landing Screen */
        <div className="relative z-10 flex-1">
          <InitialLanding
            onOpenApp={() => setHasEnteredApp(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            settings={settings}
            pwa={pwa}
          />
        </div>
      ) : (
        /* 2. Main App Screen (Tools Catalog or Active Tool) */
        <>
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

          {/* Content sits in its own stacking context above the fixed ambient backdrop */}
          <div className="relative z-10 flex flex-col flex-1">
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
              {activeTool ? (
                /* Active Tool Screen */
                <div className="space-y-4 animate-ios-fade">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveToolId(null)}
                      className="bru-btn px-3 py-2 text-sm"
                      aria-label={t("allTools")}
                    >
                      <ArrowLeft className="w-4 h-4" strokeWidth={3} />
                      <span>{t("allTools")}</span>
                    </button>

                    <span className="text-xs font-bold px-2 py-1 bg-[var(--bru-accent)] text-[#0a0a0a] border-2 border-[var(--bru-ink)]">
                      {activeTool.badge || activeTool.category}
                    </span>
                  </div>

                  {/* Tool Container */}
                  <div className="bru-box p-4 sm:p-7">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredTools.map((tool) => (
                        <ToolCard
                          key={tool.id}
                          tool={tool}
                          onSelect={(id) => setActiveToolId(id)}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Kosong */
                    <div className="bru-box p-10 text-center space-y-4">
                      <div className="bru-icon w-14 h-14 mx-auto">
                        <SearchX className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <p className="text-base font-extrabold">
                        {language === "id" ? "Tidak ketemu" : "Nothing found"}
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("all");
                        }}
                        className="bru-btn bru-btn-accent px-4 py-2.5 text-sm"
                      >
                        <RotateCcw className="w-4 h-4" strokeWidth={3} />
                        <span>Reset</span>
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
        </>
      )}

      {/* SINGLE Persistent YtPlay Background Player (Never unmounts or resets across navigation) */}
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

      {/* No-Internet Toast */}
      {!pwa.isOnline && (
        <div
          className="fixed bottom-4 inset-x-4 sm:inset-x-0 sm:mx-auto sm:w-fit z-50 flex items-center gap-2 px-3.5 py-2.5 bg-[var(--bru-accent)] text-[#0a0a0a] border-2 border-[#0a0a0a] text-xs font-bold shadow-[3px_3px_0_0_#0a0a0a]"
          title={t("noInternetDesc")}
        >
          <WifiOff className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          <span>{t("noInternetTitle")}</span>
        </div>
      )}
    </div>
  );
}
