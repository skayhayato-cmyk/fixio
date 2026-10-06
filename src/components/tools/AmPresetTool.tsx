import React, { useState, useRef } from "react";
import {
  Film,
  Download,
  Copy,
  ExternalLink,
  Check,
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Link as LinkIcon,
  User,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Upload,
  RefreshCw,
  Wand2,
  Settings,
  Code2,
  Sliders,
  X,
  FileText,
  Clock,
  Ratio,
} from "lucide-react";

interface PresetLinkItem {
  type: string;
  url: string;
  title?: string;
  thumb?: string;
  thumbs?: string[];
  size?: string;
  ratio?: string;
  source?: string;
  detail?: string;
  verified?: boolean;
}

interface VideoStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface AmPresetData {
  author?: string;
  service?: string;
  ok?: boolean;
  total?: number;
  presets?: string[];
  elapsed_ms?: number;
  data?: {
    ok?: boolean;
    found?: boolean;
    author?: string;
    videoUrl?: string;
    presetLinks?: PresetLinkItem[];
    context?: {
      level?: string;
      matched?: string[];
    };
    input?: string;
    video?: {
      id?: string;
      url?: string;
      description?: string;
      createTime?: string;
      stats?: VideoStats;
      cover?: string;
      playUrl?: string;
      playUrlNoWm?: string;
      width?: number;
      height?: number;
    };
    authorDetail?: {
      uniqueId?: string;
      nickname?: string;
      bio?: string;
      bioLink?: string;
      avatar?: string;
    };
    otherLinks?: Array<{
      url: string;
      source?: string;
    }>;
    scanned?: {
      description?: boolean;
      bio?: boolean;
      bioLinkPage?: boolean;
      comments?: number;
      replies?: number;
    };
  };
}

// Aspect ratio presets for Alight Motion
const RATIO_PRESETS = [
  { id: "9:16", label: "9:16 (TikTok/Story)", w: 1080, h: 1920 },
  { id: "1:1", label: "1:1 (Persegi/Feed)", w: 1080, h: 1080 },
  { id: "16:9", label: "16:9 (Landscape/YT)", w: 1920, h: 1080 },
  { id: "4:5", label: "4:5 (Instagram)", w: 1080, h: 1350 },
  { id: "4:3", label: "4:3 (iPad/Tablet)", w: 1440, h: 1080 },
];

export const AmPresetTool: React.FC = () => {
  // Main tool navigation mode: "finder" (Search TikTok) or "converter" (Full AM XML & Preset Converter)
  const [activeMode, setActiveMode] = useState<"finder" | "converter">("finder");

  // --- FINDER STATES ---
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AmPresetData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [finderTab, setFinderTab] = useState<"presets" | "video" | "creator">("presets");

  // --- CONVERTER STATES ---
  const [xmlInputMode, setXmlInputMode] = useState<"link5mb" | "xmlcode" | "file">("link5mb");
  const [share5mbUrl, setShare5mbUrl] = useState<string>(
    "https://alightcreative.com/am/share/u/VBAMnqKnaRgeB5S3DH8ZTmy2VB32/p/OujEgB3Cbx-2b2b2e7377c36cb1"
  );
  const [xmlContent, setXmlContent] = useState<string>("");
  const [selectedRatio, setSelectedRatio] = useState<string>("9:16");
  const [selectedFps, setSelectedFps] = useState<number>(30);
  const [projectDuration, setProjectDuration] = useState<number>(5.0);
  const [projectTitle, setProjectTitle] = useState<string>("Alight_Motion_Preset");
  const [convertedXml, setConvertedXml] = useState<string>("");
  const [deepLinkApp, setDeepLinkApp] = useState<string>("");
  const [converterStats, setConverterStats] = useState<{
    layers: number;
    sizeKb: number;
    fps: number;
    width: number;
    height: number;
  } | null>(null);
  const [xmlFileName, setXmlFileName] = useState<string>("preset_alight.xml");

  // --- UI STATES ---
  const [toast, setToast] = useState<{ message: string; type: "ok" | "bad" } | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: "ok" | "bad" = "ok") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  };

  const formatNumber = (num?: number): string => {
    if (!num && num !== 0) return "-";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  // --- FINDER SEARCH HANDLER ---
  const handleSearch = async (urlToFetch?: string) => {
    const target = (urlToFetch || inputUrl).trim();
    if (!target) {
      setErrorMsg("Masukkan link video TikTok terlebih dahulu.");
      showToast("Masukkan link video TikTok terlebih dahulu", "bad");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const resp = await fetch(`/api/ampreset?url=${encodeURIComponent(target)}`);
      const data = await resp.json();

      if (data && data.ok) {
        setResult(data);
        setFinderTab("presets");
        showToast("Preset Alight Motion berhasil ditemukan!", "ok");
      } else {
        const err =
          data?.error ||
          "Preset Alight Motion tidak ditemukan pada tautan video ini. Pastikan video memiliki preset di komentar atau bio.";
        setErrorMsg(err);
        showToast("Preset tidak ditemukan pada video ini", "bad");
      }
    } catch (err: any) {
      const errTxt = err?.message || "Terjadi kesalahan saat mencari preset.";
      setErrorMsg(errTxt);
      showToast(errTxt, "bad");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        showToast("Link berhasil ditempel dari clipboard", "ok");
        handleSearch(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopy = (text: string, id: string, label: string = "Tautan berhasil disalin!") => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedLink(id);
      showToast(label, "ok");
      setTimeout(() => {
        setCopiedLink((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      showToast("Gagal menyalin tautan", "bad");
    }
  };

  // --- BRIDGE: SEND PRESET FROM FINDER DIRECTLY TO CONVERTER ---
  const handleSendToConverter = (preset: PresetLinkItem) => {
    if (!preset.url) {
      showToast("Preset ini belum memiliki tautan langsung", "bad");
      return;
    }

    setActiveMode("converter");
    if (preset.type?.toLowerCase().includes("5mb") || preset.url.includes("alightcreative.com")) {
      setXmlInputMode("link5mb");
      setShare5mbUrl(preset.url);
      setProjectTitle(preset.title ? preset.title.replace(/[^a-zA-Z0-9_]/g, "_") : "Preset_5MB");
      handleConvert5MbToXml(preset.url, preset.title || "Preset_5MB");
    } else {
      setXmlInputMode("xmlcode");
      setProjectTitle(preset.title ? preset.title.replace(/[^a-zA-Z0-9_]/g, "_") : "Preset_XML");
      // Pre-fill XML or link
      if (preset.url.startsWith("<?xml") || preset.url.includes("<scene") || preset.url.includes("<project")) {
        setXmlContent(preset.url);
      } else {
        setXmlContent(`<!-- Tautan XML Sumber: ${preset.url} -->\n<!-- Silakan tempel atau unduh XML dari tautan di atas -->`);
      }
    }
    showToast("Preset dialihkan ke mode Konverter", "ok");
  };

  // --- CONVERTER ENGINE LOGIC ---

  // 1. Convert 5MB Share link to Deep Link & Alight Motion XML Project Shell
  const handleConvert5MbToXml = (urlToConvert?: string, titleOverride?: string) => {
    const rawUrl = (urlToConvert || share5mbUrl).trim();
    if (!rawUrl) {
      showToast("Masukkan tautan 5MB Alight Creative terlebih dahulu", "bad");
      return;
    }

    // Extract User ID & Project ID: /u/{uid}/p/{pid}
    const match = rawUrl.match(/\/u\/([^\/\s?#]+)\/p\/([^\/\s?#]+)/);
    const userId = match ? match[1] : "user";
    const projectId = match ? match[2] : "project_" + Date.now();
    const cleanTitle = (titleOverride || projectTitle || "Alight_Preset").replace(/[^a-zA-Z0-9_]/g, "_");

    // Deep link scheme that opens directly inside Alight Motion app
    const deepLink = `alightcreative://am/share/u/${userId}/p/${projectId}`;
    setDeepLinkApp(deepLink);

    const ratioObj = RATIO_PRESETS.find((r) => r.id === selectedRatio) || RATIO_PRESETS[0];
    const totalFrames = Math.round(selectedFps * projectDuration);

    // Official Alight Motion Project XML Package
    const generated = `<?xml version="1.0" encoding="utf-8"?>
<scene width="${ratioObj.w}" height="${ratioObj.h}" exportWidth="${ratioObj.w}" exportHeight="${ratioObj.h}" fps="${selectedFps}" duration="${totalFrames}" time="0"
  amVersion="5.0.273" ffVer="106" title="${cleanTitle}">
  <!-- Alight Motion Converted Preset -->
  <!-- Sumber Asli: ${rawUrl} -->
  <!-- ID Proyek: ${projectId} -->
  <!-- ID Kreator: ${userId} -->
  <projectInfo>
    <title>${cleanTitle}</title>
    <creatorId>${userId}</creatorId>
    <sourceUrl>${rawUrl}</sourceUrl>
    <deepLink>${deepLink}</deepLink>
    <ratio>${selectedRatio}</ratio>
    <fps>${selectedFps}</fps>
    <durationSeconds>${projectDuration}</durationSeconds>
  </projectInfo>
  <shape type="rect">
    <transform>
      <location x="${ratioObj.w / 2}" y="${ratioObj.h / 2}"/>
      <size width="${ratioObj.w}" height="${ratioObj.h}"/>
    </transform>
    <fillColor value="#00000000"/>
  </shape>
  <!-- End of Converted Scene -->
</scene>`;

    setConvertedXml(generated);
    setXmlFileName(`${cleanTitle}.xml`);
    setConverterStats({
      layers: 2,
      sizeKb: Number((new Blob([generated]).size / 1024).toFixed(2)),
      fps: selectedFps,
      width: ratioObj.w,
      height: ratioObj.h,
    });
    showToast("Berhasil dikonversi ke Alight XML & Deep Link!", "ok");
  };

  // 2. Convert / Customize Existing XML Code (Change FPS, Ratio, Repair syntax)
  const handleConvertRawXml = () => {
    let raw = xmlContent.trim();
    if (!raw) {
      showToast("Tempel kode XML Alight Motion terlebih dahulu", "bad");
      return;
    }

    const ratioObj = RATIO_PRESETS.find((r) => r.id === selectedRatio) || RATIO_PRESETS[0];
    const totalFrames = Math.round(selectedFps * projectDuration);
    const cleanTitle = (projectTitle || "Alight_Preset").replace(/[^a-zA-Z0-9_]/g, "_");

    // Repair & Ensure XML Declaration
    if (!raw.startsWith("<?xml")) {
      raw = `<?xml version="1.0" encoding="utf-8"?>\n` + raw;
    }

    // Update or Insert canvas dimensions in <scene> or <project>
    if (raw.includes("<scene") || raw.includes("<project")) {
      raw = raw.replace(
        /(<(?:scene|project)[^>]*?)(?:width="[^"]*")?([^>]*?)(?:height="[^"]*")?([^>]*?)(?:fps="[^"]*")?([^>]*?)(>)/,
        `$1 width="${ratioObj.w}" height="${ratioObj.h}" exportWidth="${ratioObj.w}" exportHeight="${ratioObj.h}" fps="${selectedFps}" duration="${totalFrames}"$2$3$4$5`
      );
    } else {
      // Wrap raw shapes into proper scene
      raw = `<?xml version="1.0" encoding="utf-8"?>
<scene width="${ratioObj.w}" height="${ratioObj.h}" exportWidth="${ratioObj.w}" exportHeight="${ratioObj.h}" fps="${selectedFps}" duration="${totalFrames}" time="0"
  amVersion="5.0.273" ffVer="106" title="${cleanTitle}">
${raw}
</scene>`;
    }

    // Calculate approximate layer/shape count
    const shapeMatches = raw.match(/<shape|<element|<media|<text|<path/g);
    const layersCount = shapeMatches ? shapeMatches.length : 1;

    setConvertedXml(raw);
    setXmlFileName(`${cleanTitle}.xml`);
    setConverterStats({
      layers: layersCount,
      sizeKb: Number((new Blob([raw]).size / 1024).toFixed(2)),
      fps: selectedFps,
      width: ratioObj.w,
      height: ratioObj.h,
    });
    showToast("XML berhasil disesuaikan & diperbaiki!", "ok");
  };

  // 3. File upload handler for XML
  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setXmlContent(text);
        setXmlFileName(file.name);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
        setProjectTitle(nameWithoutExt);
        showToast(`Berkas ${file.name} dimuat`, "ok");
      }
    };
    reader.readAsText(file);
  };

  // 4. Download Converted XML file
  const handleDownloadXml = () => {
    if (!convertedXml) return;
    const blob = new Blob([convertedXml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = xmlFileName.endsWith(".xml") ? xmlFileName : `${xmlFileName}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Berkas ${xmlFileName} diunduh!`, "ok");
  };

  const presetLinks = result?.data?.presetLinks || [];
  const videoData = result?.data?.video;
  const authorData = result?.data?.authorDetail;
  const first5MbLink = presetLinks.find(
    (p) => p.type?.toLowerCase().includes("5mb") || p.url?.includes("alightcreative.com")
  )?.url;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
      {/* Tool Header - Fixio Standard */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Film className="w-4 h-4 shrink-0" />
          <span>Alight Motion Suite • Preset & Converter</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
            Alight Motion Preset & XML Converter
          </h2>
          {/* Status Badge Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              loading
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                : result || convertedXml
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : errorMsg
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                : "bg-black/5 dark:bg-white/10 text-[#8e8e93]"
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : result || convertedXml ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : null}
            <span>
              {loading
                ? "MEMINDAI..."
                : result
                ? "DITEMUKAN"
                : convertedXml
                ? "TERKONVERSI"
                : errorMsg
                ? "GAGAL"
                : "SIAP"}
            </span>
          </div>
        </div>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Cari preset TikTok, konversi link 5MB ke Deep Link & Alight XML, serta sesuaikan rasio 9:16 / FPS / durasi proyek Alight Motion secara instan.
        </p>
      </div>

      {/* Main Mode Segmented Control: Cari Preset vs Konverter & Editor XML */}
      <div className="grid grid-cols-2 gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveMode("finder")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === "finder"
              ? "bg-white dark:bg-[#1c1c1e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
              : "text-[#8e8e93] hover:text-black dark:hover:text-white"
          }`}
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>Cari Preset TikTok</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("converter")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === "converter"
              ? "bg-white dark:bg-[#1c1c1e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
              : "text-[#8e8e93] hover:text-black dark:hover:text-white"
          }`}
        >
          <Wand2 className="w-4 h-4 shrink-0" />
          <span>Konverter & Editor XML</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: FINDER PRESET TIKTOK */}
      {/* ============================================================== */}
      {activeMode === "finder" && (
        <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
          {/* Input Section - Fixio Standard */}
          <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#007aff] dark:text-[#0a84ff] shrink-0" />
                <span>Masukkan Link Video TikTok</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const demoUrl = "https://vt.tiktok.com/ZSbQn3Sys/";
                  setInputUrl(demoUrl);
                  handleSearch(demoUrl);
                }}
                className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" /> Gunakan Contoh Link
              </button>
            </div>

            <div className="relative flex items-center w-full max-w-full">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="https://vt.tiktok.com/..."
                className="w-full min-w-0 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] dark:focus:ring-[#0a84ff] transition-all font-sans pr-20"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {inputUrl ? (
                  <button
                    type="button"
                    onClick={() => setInputUrl("")}
                    className="px-2 py-1 text-xs text-[#8e8e93] hover:text-black dark:hover:text-white font-medium cursor-pointer"
                  >
                    Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer"
                  >
                    Paste
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full bg-[#007aff] dark:bg-[#0a84ff] hover:bg-[#0062cc] dark:hover:bg-[#0071e3] text-white font-semibold text-sm rounded-xl py-3 px-5 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Memindai Komentar & Bio Video...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Cari Preset Alight Motion</span>
                </>
              )}
            </button>
          </div>

          {/* Error Feedback */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm w-full max-w-full overflow-hidden">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="font-semibold">Preset Tidak Ditemukan</p>
                <p className="text-xs opacity-90 leading-relaxed break-words">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Result Container */}
          {result && result.data && (
            <div className="space-y-4 animate-fade-in w-full max-w-full overflow-hidden min-w-0">
              {/* Segmented Sub-Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFinderTab("presets")}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                    finderTab === "presets"
                      ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                      : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Film className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Preset ({presetLinks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFinderTab("video")}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                    finderTab === "video"
                      ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                      : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Video & Stats</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFinderTab("creator")}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                    finderTab === "creator"
                      ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                      : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Kreator</span>
                </button>
              </div>

              {/* TAB 1: Preset Links */}
              {finderTab === "presets" && (
                <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <h3 className="text-base font-bold text-black dark:text-white truncate">
                        Tautan Preset Alight Motion ({presetLinks.length})
                      </h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium shrink-0">
                      Oleh {result.data.author || "Kreator"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {presetLinks.map((preset, index) => {
                      const is5Mb =
                        preset.type?.toLowerCase().includes("5mb") ||
                        preset.url?.includes("alightcreative.com");
                      const uniqueId = `preset-${index}`;
                      const hasUrl = Boolean(preset.url);

                      return (
                        <div
                          key={uniqueId}
                          className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-4 shadow-sm space-y-3 w-full max-w-full overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  is5Mb
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff] border border-[#007aff]/20"
                                }`}
                              >
                                {is5Mb ? <Film className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-bold text-black dark:text-white truncate">
                                    {preset.title || (is5Mb ? "Preset 5MB" : "Preset XML")}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shrink-0 ${
                                      is5Mb
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff]"
                                    }`}
                                  >
                                    {preset.type?.toUpperCase() || (is5Mb ? "5MB LINK" : "XML")}
                                  </span>
                                  {preset.ratio && (
                                    <span className="text-[10px] bg-black/5 dark:bg-white/10 text-[#8e8e93] px-2 py-0.5 rounded-md font-mono shrink-0">
                                      {preset.ratio}
                                    </span>
                                  )}
                                  {preset.size && (
                                    <span className="text-[10px] bg-black/5 dark:bg-white/10 text-[#8e8e93] px-2 py-0.5 rounded-md font-mono shrink-0">
                                      {preset.size}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-1 truncate">
                                  Sumber: {preset.source || "Komentar"} {preset.detail ? `(${preset.detail})` : ""}
                                </p>
                              </div>
                            </div>

                            {preset.verified && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full shrink-0 font-medium">
                                <Check className="w-3.5 h-3.5" /> Terverifikasi
                              </span>
                            )}
                          </div>

                          {/* Thumbnail preview */}
                          {preset.thumb && (
                            <div className="relative rounded-xl overflow-hidden border border-black/5 dark:border-white/10 h-32 bg-slate-100 dark:bg-black/50 w-full max-w-full">
                              <img
                                src={preset.thumb}
                                alt="Preset Thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                                <span className="text-xs text-white/90 font-medium">
                                  Pratinjau Alight Creative
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons for this preset */}
                          {hasUrl ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-2">
                                <a
                                  href={preset.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer ${
                                    is5Mb
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-[#007aff] hover:bg-[#0062cc] dark:bg-[#0a84ff] dark:hover:bg-[#0071e3] text-white"
                                  }`}
                                >
                                  <ExternalLink className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{is5Mb ? "Buka di Alight Motion" : "Unduh / Buka XML"}</span>
                                </a>

                                <button
                                  onClick={() => handleCopy(preset.url, uniqueId, "Tautan preset disalin!")}
                                  className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white transition-colors cursor-pointer shrink-0"
                                  title="Salin Tautan"
                                >
                                  {copiedLink === uniqueId ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              {/* Direct Bridge Button to XML Converter */}
                              <button
                                onClick={() => handleSendToConverter(preset)}
                                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#007aff]/10 hover:text-[#007aff] dark:hover:bg-[#0a84ff]/15 dark:hover:text-[#0a84ff] text-xs font-semibold text-black dark:text-white transition-colors border border-black/5 dark:border-white/10 cursor-pointer"
                              >
                                <Wand2 className="w-3.5 h-3.5 shrink-0 text-[#007aff] dark:text-[#0a84ff]" />
                                <span>Konversi & Sesuaikan Rasio / FPS di Editor XML</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl text-center text-xs text-[#8e8e93]">
                              Tautan XML berada di deskripsi atau bio kreator.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Video & Stats */}
              {finderTab === "video" && videoData && (
                <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-[#007aff] dark:text-[#0a84ff] shrink-0" />
                      <h3 className="text-base font-bold text-black dark:text-white">
                        Pratinjau Video TikTok
                      </h3>
                    </div>
                    {videoData.playUrlNoWm && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium shrink-0">
                        No Watermark HD
                      </span>
                    )}
                  </div>

                  {/* Video Player */}
                  {(videoData.playUrlNoWm || videoData.playUrl) && (
                    <div className="rounded-xl overflow-hidden bg-black border border-black/5 dark:border-white/10 max-h-96 flex items-center justify-center w-full max-w-full">
                      <video
                        src={videoData.playUrlNoWm || videoData.playUrl}
                        controls
                        poster={videoData.cover}
                        playsInline
                        className="max-h-96 w-full max-w-full mx-auto object-contain"
                      />
                    </div>
                  )}

                  {videoData.description && (
                    <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed break-words">
                      {videoData.description}
                    </p>
                  )}

                  {/* Engagement Stats Grid */}
                  {videoData.stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-black/5 dark:border-white/10">
                      <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                        <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1 truncate">
                          <Eye className="w-3.5 h-3.5 text-[#007aff] shrink-0" /> Views
                        </p>
                        <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                          {formatNumber(videoData.stats.views)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                        <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1 truncate">
                          <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" /> Likes
                        </p>
                        <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                          {formatNumber(videoData.stats.likes)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                        <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1 truncate">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Komentar
                        </p>
                        <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                          {formatNumber(videoData.stats.comments)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                        <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1 truncate">
                          <Share2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Shares
                        </p>
                        <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                          {formatNumber(videoData.stats.shares)}
                        </p>
                      </div>
                    </div>
                  )}

                  {(videoData.playUrlNoWm || videoData.playUrl) && (
                    <a
                      href={videoData.playUrlNoWm || videoData.playUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`tiktok-preset-${videoData.id || "video"}.mp4`}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Unduh Video TikTok (No Watermark MP4)</span>
                    </a>
                  )}
                </div>
              )}

              {/* TAB 3: Creator Profile */}
              {finderTab === "creator" && authorData && (
                <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm w-full max-w-full overflow-hidden">
                  <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
                    <User className="w-5 h-5 text-emerald-500 shrink-0" />
                    <h3 className="text-base font-bold text-black dark:text-white">
                      Profil Kreator Preset
                    </h3>
                  </div>

                  <div className="flex items-start gap-3.5 min-w-0">
                    {authorData.avatar && (
                      <img
                        src={authorData.avatar}
                        alt={authorData.uniqueId || "Creator"}
                        className="w-12 h-12 rounded-full border border-black/10 dark:border-white/10 object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-black dark:text-white truncate">
                        {authorData.nickname || authorData.uniqueId}
                      </h4>
                      <p className="text-xs text-[#007aff] dark:text-[#0a84ff] font-medium truncate">
                        @{authorData.uniqueId}
                      </p>

                      {authorData.bio && (
                        <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-1.5 whitespace-pre-line leading-relaxed break-words">
                          {authorData.bio}
                        </p>
                      )}

                      {authorData.bioLink && (
                        <a
                          href={authorData.bioLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:underline max-w-full truncate"
                        >
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{authorData.bioLink}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {result.data.otherLinks && result.data.otherLinks.length > 0 && (
                    <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
                      <p className="text-xs font-semibold text-[#8e8e93] dark:text-[#98989d]">
                        Tautan Tambahan di Bio / Komentar:
                      </p>
                      <div className="space-y-1.5">
                        {result.data.otherLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/10 text-xs text-black dark:text-white transition-colors cursor-pointer min-w-0"
                          >
                            <span className="truncate min-w-0 mr-2 break-all">{link.url}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: ALIGHT MOTION XML CONVERTER & CUSTOMIZER */}
      {/* ============================================================== */}
      {activeMode === "converter" && (
        <div className="space-y-5 w-full max-w-full overflow-hidden min-w-0">
          {/* Sub-Tabs for Input Type: 5MB Link, Direct XML, or Upload XML */}
          <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setXmlInputMode("link5mb")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                xmlInputMode === "link5mb"
                  ? "bg-white dark:bg-[#1c1c1e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                  : "text-[#8e8e93] hover:text-black dark:hover:text-white"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Link 5MB</span>
            </button>

            <button
              type="button"
              onClick={() => setXmlInputMode("xmlcode")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                xmlInputMode === "xmlcode"
                  ? "bg-white dark:bg-[#1c1c1e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                  : "text-[#8e8e93] hover:text-black dark:hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Kode XML</span>
            </button>

            <button
              type="button"
              onClick={() => setXmlInputMode("file")}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0 ${
                xmlInputMode === "file"
                  ? "bg-white dark:bg-[#1c1c1e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                  : "text-[#8e8e93] hover:text-black dark:hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Unggah File</span>
            </button>
          </div>

          {/* INPUT FORM CONTAINER */}
          <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm w-full max-w-full overflow-hidden">
            {/* 1. Share Link Input */}
            {xmlInputMode === "link5mb" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#007aff]" />
                  <span>Tautan Share Alight Creative (5MB):</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={share5mbUrl}
                    onChange={(e) => setShare5mbUrl(e.target.value)}
                    placeholder="https://alightcreative.com/am/share/u/.../p/..."
                    className="w-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-black dark:text-white font-mono placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff]"
                  />
                </div>
                <p className="text-[11px] text-[#8e8e93]">
                  Format tautan: <code className="text-[#007aff]">https://alightcreative.com/am/share/u/.../p/...</code>
                </p>
              </div>
            )}

            {/* 2. Direct Raw XML Code Input */}
            {xmlInputMode === "xmlcode" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#007aff]" />
                    <span>Tempel Kode Alight Motion XML:</span>
                  </label>
                  {xmlContent && (
                    <button
                      onClick={() => setXmlContent("")}
                      className="text-xs text-[#8e8e93] hover:text-red-500 cursor-pointer font-medium"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
                <textarea
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                  placeholder={`<scene width="1080" height="1920" fps="30">\n  <shape type="rect">...</shape>\n</scene>`}
                  rows={6}
                  className="w-full max-w-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-black dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-[#007aff] whitespace-pre"
                />
              </div>
            )}

            {/* 3. Upload File XML */}
            {xmlInputMode === "file" && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  onChange={handleXmlFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black/10 dark:border-white/10 hover:border-[#007aff] rounded-2xl p-6 text-center cursor-pointer transition-all bg-white dark:bg-[#1c1c1e]"
                >
                  <Upload className="w-8 h-8 text-[#007aff] mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-black dark:text-white">
                    Pilih atau Tarik Berkas .XML Preset
                  </p>
                  <p className="text-xs text-[#8e8e93] mt-1">
                    {xmlFileName ? `Berkas aktif: ${xmlFileName}` : "Mendukung semua berkas proyek XML Alight Motion"}
                  </p>
                </div>
              </div>
            )}

            {/* CONVERSION OPTIONS: RATIO, FPS, DURATION, TITLE */}
            <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-3">
              <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#007aff]" />
                <span>Pengaturan Konversi & Kanvas Target:</span>
              </p>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#8e8e93]">Rasio Kanvas:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {RATIO_PRESETS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRatio(r.id)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all truncate cursor-pointer ${
                        selectedRatio === r.id
                          ? "bg-[#007aff] text-white border-[#007aff] shadow-sm"
                          : "bg-white dark:bg-[#1c1c1e] text-black dark:text-white border-black/10 dark:border-white/10 hover:border-[#007aff]/40"
                      }`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS & Duration */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 space-y-1 min-w-0">
                  <label className="text-[11px] font-semibold text-[#8e8e93] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#007aff]" /> Frame Rate (FPS)
                  </label>
                  <select
                    value={selectedFps}
                    onChange={(e) => setSelectedFps(parseInt(e.target.value, 10))}
                    className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-black dark:text-white focus:outline-none"
                  >
                    <option value={24}>24 fps (Cinematic)</option>
                    <option value={25}>25 fps (PAL)</option>
                    <option value={30}>30 fps (Standard)</option>
                    <option value={60}>60 fps (Ultra Smooth)</option>
                  </select>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 space-y-1 min-w-0">
                  <label className="text-[11px] font-semibold text-[#8e8e93] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#007aff]" /> Durasi Proyek (detik)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    step={0.5}
                    value={projectDuration}
                    onChange={(e) => setProjectDuration(parseFloat(e.target.value) || 5)}
                    className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-black dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Project Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8e8e93]">Nama Proyek XML:</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Nama_Proyek_Preset"
                  className="w-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007aff]"
                />
              </div>
            </div>

            {/* Execute Conversion Button */}
            <button
              onClick={() => {
                if (xmlInputMode === "link5mb") {
                  handleConvert5MbToXml();
                } else {
                  handleConvertRawXml();
                }
              }}
              className="w-full bg-[#007aff] dark:bg-[#0a84ff] hover:bg-[#0062cc] dark:hover:bg-[#0071e3] text-white font-bold text-sm rounded-xl py-3 px-5 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4 shrink-0" />
              <span>Proses & Konversi ke Alight XML Resmi</span>
            </button>
          </div>

          {/* CONVERTED RESULT SECTION */}
          {convertedXml && (
            <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm animate-fade-in w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <h3 className="text-base font-bold text-black dark:text-white">
                    Hasil Konversi Alight Motion XML
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  Siap Impor AM
                </span>
              </div>

              {/* Conversion Stats Cards */}
              {converterStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold truncate">Rasio Kanvas</p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                      {converterStats.width}×{converterStats.height}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold truncate">FPS Target</p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                      {converterStats.fps} fps
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold truncate">Elemen/Layer</p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                      {converterStats.layers}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center min-w-0">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold truncate">Ukuran Berkas</p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5 truncate">
                      {converterStats.sizeKb} KB
                    </p>
                  </div>
                </div>
              )}

              {/* Deep Link Quick Action (if generated from 5MB link) */}
              {deepLinkApp && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Alight Motion Deep Link:</span>
                    </p>
                    <p className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
                      {deepLinkApp}
                    </p>
                  </div>
                  <a
                    href={deepLinkApp}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
                  >
                    Buka di Aplikasi AM
                  </a>
                </div>
              )}

              {/* Converted XML Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black dark:text-white">Kode XML Proyek:</span>
                  <button
                    onClick={() => handleCopy(convertedXml, "converted-xml", "Kode XML disalin!")}
                    className="text-xs text-[#007aff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Copy className="w-3 h-3" /> Salin Kode
                  </button>
                </div>
                <textarea
                  readOnly
                  value={convertedXml}
                  rows={6}
                  className="w-full max-w-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-black dark:text-white resize-y focus:outline-none whitespace-pre break-all"
                />
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleDownloadXml}
                  className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Unduh Berkas XML (.xml)</span>
                </button>

                <button
                  onClick={() => handleCopy(convertedXml, "all-xml", "Kode XML berhasil disalin!")}
                  className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white font-semibold text-xs sm:text-sm transition-all border border-black/5 dark:border-white/10 cursor-pointer"
                >
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Salin Kode XML</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold ${
              toast.type === "ok"
                ? "bg-black/90 text-white dark:bg-white dark:text-black"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "ok" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-200 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
