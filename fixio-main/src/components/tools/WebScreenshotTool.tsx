import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, Globe, Download, Loader2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { fetchProxiedJson, getProxiedImageUrl, triggerDownload } from "../../services/api";
import { SsWebResponse } from "../../types";

interface DeviceResult {
  device: "dekstop" | "tablet" | "phone";
  label: string;
  icon: any;
  url: string | null;
  loading: boolean;
  error: string | null;
}

export const WebScreenshotTool: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState("https://google.com");
  const [activeTab, setActiveTab] = useState<"dekstop" | "tablet" | "phone" | "all">("all");
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [devices, setDevices] = useState<{
    dekstop: DeviceResult;
    tablet: DeviceResult;
    phone: DeviceResult;
  }>({
    dekstop: { device: "dekstop", label: "Desktop (1920x1080)", icon: Monitor, url: null, loading: false, error: null },
    tablet: { device: "tablet", label: "Tablet (iPad)", icon: Tablet, url: null, loading: false, error: null },
    phone: { device: "phone", label: "Smartphone (Mobile)", icon: Smartphone, url: null, loading: false, error: null },
  });

  const normalizeUrl = (input: string): string => {
    let url = input.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return url;
  };

  const handleCaptureSingle = async (deviceKey: "dekstop" | "tablet" | "phone", urlToCapture: string) => {
    setDevices((prev) => ({
      ...prev,
      [deviceKey]: { ...prev[deviceKey], loading: true, error: null },
    }));

    try {
      const endpoint = `https://api.nexadev.my.id/api/ss?url=${encodeURIComponent(urlToCapture)}&device=${deviceKey}`;
      const res = await fetchProxiedJson<SsWebResponse>(endpoint);

      if (res.status && res.data?.url) {
        setDevices((prev) => ({
          ...prev,
          [deviceKey]: { ...prev[deviceKey], url: res.data!.url, loading: false, error: null },
        }));
      } else {
        setDevices((prev) => ({
          ...prev,
          [deviceKey]: { ...prev[deviceKey], loading: false, error: res.message || "Gagal mengambil tangkapan layar" },
        }));
      }
    } catch (err: any) {
      setDevices((prev) => ({
        ...prev,
        [deviceKey]: { ...prev[deviceKey], loading: false, error: err.message || "Koneksi ke API screenshot gagal" },
      }));
    }
  };

  const handleCaptureAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalUrl = normalizeUrl(targetUrl);
    setTargetUrl(finalUrl);

    setIsProcessingAll(true);
    await Promise.all([
      handleCaptureSingle("dekstop", finalUrl),
      handleCaptureSingle("tablet", finalUrl),
      handleCaptureSingle("phone", finalUrl),
    ]);
    setIsProcessingAll(false);
  };

  const handleDownloadImage = (imgUrl: string, device: string) => {
    const filename = `ss_${device}_${Date.now()}.png`;
    triggerDownload(imgUrl, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Globe className="w-4 h-4" />
          <span>Multi-Device Web Capture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Screenshot Web Responsive
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Ambil tangkapan layar halaman web secara lengkap dalam resolusi Desktop, Tablet, dan Ponsel secara bersamaan.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCaptureAll} className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-black dark:text-white mb-1.5">
            URL Website Target
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-[#8e8e93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessingAll || !targetUrl}
              className="px-5 py-2.5 ios-btn-primary text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isProcessingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Mengambil...</span>
                </>
              ) : (
                <>
                  <Monitor className="w-4 h-4" />
                  <span>Ambil Semua</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Device view switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {(["all", "dekstop", "tablet", "phone"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-xs border border-black/5 dark:border-white/10 font-semibold"
                    : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
                }`}
              >
                {tab === "all" && <span>Semua Tampilan (3x)</span>}
                {tab === "dekstop" && <><Monitor className="w-3.5 h-3.5" /> Desktop</>}
                {tab === "tablet" && <><Tablet className="w-3.5 h-3.5" /> Tablet</>}
                {tab === "phone" && <><Smartphone className="w-3.5 h-3.5" /> Ponsel</>}
              </button>
            );
          })}
        </div>
      </form>

      {/* Device Previews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["dekstop", "tablet", "phone"] as const).map((deviceKey) => {
          if (activeTab !== "all" && activeTab !== deviceKey) return null;
          const dev = devices[deviceKey];
          const Icon = dev.icon;

          return (
            <div
              key={deviceKey}
              className={`bg-slate-50/50 dark:bg-[#121214] p-4 rounded-2xl border border-black/5 dark:border-white/10 flex flex-col justify-between space-y-3 ${
                activeTab === deviceKey ? "md:col-span-3" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-black/5 dark:bg-white/10 rounded-lg text-black dark:text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white">{dev.label}</h4>
                    <span className="text-[10px] text-[#8e8e93] uppercase font-mono">{deviceKey}</span>
                  </div>
                </div>

                {dev.url && (
                  <button
                    onClick={() => handleDownloadImage(dev.url!, deviceKey)}
                    className="p-1.5 text-[#007aff] hover:bg-[#007aff]/10 rounded-lg transition-colors cursor-pointer"
                    title="Download Screenshot"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Viewport Frame */}
              <div className="w-full bg-white dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 min-h-[220px] flex items-center justify-center overflow-hidden relative">
                {dev.loading ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-[#8e8e93]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#007aff]" />
                    <span className="text-xs">Mengambil screenshot...</span>
                  </div>
                ) : dev.error ? (
                  <div className="p-4 text-center text-rose-500 text-xs flex flex-col items-center gap-1.5">
                    <AlertCircle className="w-5 h-5" />
                    <span>{dev.error}</span>
                    <button
                      onClick={() => handleCaptureSingle(deviceKey, targetUrl)}
                      className="mt-2 text-[#007aff] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" /> Coba Lagi
                    </button>
                  </div>
                ) : dev.url ? (
                  <img
                    src={getProxiedImageUrl(dev.url)}
                    alt={`${dev.label} Screenshot`}
                    className="w-full h-auto object-top object-contain max-h-[400px]"
                  />
                ) : (
                  <div className="text-center p-6 text-[#8e8e93] dark:text-[#98989d]">
                    <Icon className="w-8 h-8 mx-auto opacity-30 mb-1" />
                    <p className="text-xs">Belum ada screenshot</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
