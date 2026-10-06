import React, { useState } from "react";
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
  Shapes,
  X,
  Clock,
  Layers,
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

interface AmPresetToolProps {
  onSelectTool?: (toolId: string) => void;
}

export const AmPresetTool: React.FC<AmPresetToolProps> = ({ onSelectTool }) => {
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AmPresetData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "video" | "creator">("presets");
  const [toast, setToast] = useState<{ message: string; type: "ok" | "bad" } | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

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
        setActiveTab("presets");
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

  const handleCopyAllPresets = () => {
    if (!result?.data?.presetLinks?.length) return;
    const linksText = result.data.presetLinks
      .map((p, idx) => `${idx + 1}. [${p.type?.toUpperCase() || "PRESET"}] ${p.title || "Preset"}: ${p.url || "(Di bio/komentar)"}`)
      .join("\n");
    handleCopy(linksText, "all-presets", "Semua tautan preset disalin!");
  };

  const presetLinks = result?.data?.presetLinks || [];
  const videoData = result?.data?.video;
  const authorData = result?.data?.authorDetail;
  const first5MbLink = presetLinks.find(
    (p) => p.type?.toLowerCase().includes("5mb") || p.url?.includes("alightcreative.com")
  )?.url;

  return (
    <div className="space-y-6">
      {/* Tool Header - Fixio Standard */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Film className="w-4 h-4" />
          <span>Alight Motion Suite • Preset Extractor</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
            Alight Motion Preset Finder
          </h2>
          {/* Status Badge Pill (Matched with AutoTrace) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              loading
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                : result
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : errorMsg
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                : "bg-black/5 dark:bg-white/10 text-[#8e8e93]"
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : result ? (
              <Check className="w-3.5 h-3.5" />
            ) : null}
            <span>{loading ? "MEMINDAI..." : result ? "DITEMUKAN" : errorMsg ? "GAGAL" : "SIAP"}</span>
          </div>
        </div>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Ekstrak tautan Preset 5MB resmi & berkas XML dari video TikTok secara otomatis ke proyek Alight Motion.
        </p>
      </div>

      {/* Alight Motion Suite Switcher (Harmonized with AutoTrace) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onSelectTool?.("auto-trace")}
          className="py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all text-[#8e8e93] hover:text-black dark:hover:text-white cursor-pointer"
        >
          <Shapes className="w-4 h-4" />
          <span>Auto Trace (Raster → SVG/XML)</span>
        </button>

        <button
          type="button"
          className="py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all bg-white dark:bg-[#1c1c1e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
        >
          <Film className="w-4 h-4" />
          <span>AM Preset Finder (TikTok)</span>
        </button>
      </div>

      {/* Input Section - Fixio Standard */}
      <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#007aff] dark:text-[#0a84ff]" />
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
            <Sparkles className="w-3.5 h-3.5" /> Gunakan Contoh Link
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="https://vt.tiktok.com/..."
            className="w-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] dark:focus:ring-[#0a84ff] transition-all font-sans pr-20"
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
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memindai Komentar & Bio Video...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Cari Preset Alight Motion</span>
            </>
          )}
        </button>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Preset Tidak Ditemukan</p>
            <p className="text-xs opacity-90 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Result Container */}
      {result && result.data && (
        <div className="space-y-4 animate-fade-in">
          {/* Tabs Navigation for Results (Matched with AutoTrace Tabs) */}
          <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "presets"
                  ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                  : "text-[#8e8e93] hover:text-black dark:hover:text-white"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Tautan Preset ({presetLinks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("video")}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "video"
                  ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                  : "text-[#8e8e93] hover:text-black dark:hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video & Statistik</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("creator")}
              className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "creator"
                  ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm font-bold"
                  : "text-[#8e8e93] hover:text-black dark:hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil Kreator</span>
            </button>
          </div>

          {/* TAB 1: Preset Links Section */}
          {activeTab === "presets" && (
            <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-black dark:text-white">
                    Tautan Preset Alight Motion ({presetLinks.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAllPresets}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-semibold text-black dark:text-white cursor-pointer"
                  >
                    Salin Semua
                  </button>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium">
                    Oleh {result.data.author || "Kreator"}
                  </span>
                </div>
              </div>

              {/* List of Found Presets */}
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
                      className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-4 shadow-sm space-y-3"
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
                              <span className="text-sm font-bold text-black dark:text-white">
                                {preset.title || (is5Mb ? "Preset 5MB" : "Preset XML")}
                              </span>
                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                                  is5Mb
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff]"
                                }`}
                              >
                                {preset.type?.toUpperCase() || (is5Mb ? "5MB LINK" : "XML")}
                              </span>
                              {preset.ratio && (
                                <span className="text-[10px] bg-black/5 dark:bg-white/10 text-[#8e8e93] px-2 py-0.5 rounded-md font-mono">
                                  {preset.ratio}
                                </span>
                              )}
                              {preset.size && (
                                <span className="text-[10px] bg-black/5 dark:bg-white/10 text-[#8e8e93] px-2 py-0.5 rounded-md font-mono">
                                  {preset.size}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-1">
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

                      {/* Thumbnail preview if present */}
                      {preset.thumb && (
                        <div className="relative rounded-xl overflow-hidden border border-black/5 dark:border-white/10 h-32 bg-slate-100 dark:bg-black/50">
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

                      {/* Actions for this preset */}
                      {hasUrl ? (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={preset.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer ${
                              is5Mb
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-[#007aff] hover:bg-[#0062cc] dark:bg-[#0a84ff] dark:hover:bg-[#0071e3] text-white"
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>{is5Mb ? "Buka di Alight Motion" : "Unduh / Buka Preset XML"}</span>
                          </a>

                          <button
                            onClick={() => handleCopy(preset.url, uniqueId, "Tautan preset disalin!")}
                            className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white transition-colors cursor-pointer"
                            title="Salin Tautan"
                          >
                            {copiedLink === uniqueId ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl text-center text-xs text-[#8e8e93]">
                          Tautan XML berada di deskripsi atau bio kreator (dapat dicek di bagian tab Profil).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TikTok Video & Stats Section */}
          {activeTab === "video" && videoData && (
            <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#007aff] dark:text-[#0a84ff]" />
                  <h3 className="text-base font-bold text-black dark:text-white">
                    Pratinjau Video TikTok
                  </h3>
                </div>
                {videoData.playUrlNoWm && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium">
                    No Watermark HD
                  </span>
                )}
              </div>

              {/* Video Player */}
              {(videoData.playUrlNoWm || videoData.playUrl) && (
                <div className="rounded-xl overflow-hidden bg-black border border-black/5 dark:border-white/10 max-h-96 flex items-center justify-center">
                  <video
                    src={videoData.playUrlNoWm || videoData.playUrl}
                    controls
                    poster={videoData.cover}
                    playsInline
                    className="max-h-96 w-auto mx-auto object-contain"
                  />
                </div>
              )}

              {/* Video Description */}
              {videoData.description && (
                <p className="text-xs sm:text-sm text-black dark:text-white leading-relaxed">
                  {videoData.description}
                </p>
              )}

              {/* Engagement Stats Grid (Matched with AutoTrace 4-card Stats) */}
              {videoData.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-black/5 dark:border-white/10">
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#007aff]" /> Views
                    </p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                      {formatNumber(videoData.stats.views)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Likes
                    </p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                      {formatNumber(videoData.stats.likes)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> Komentar
                    </p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                      {formatNumber(videoData.stats.comments)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-[#8e8e93] uppercase font-bold flex items-center justify-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-amber-500" /> Shares
                    </p>
                    <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                      {formatNumber(videoData.stats.shares)}
                    </p>
                  </div>
                </div>
              )}

              {/* Download Video Button */}
              {(videoData.playUrlNoWm || videoData.playUrl) && (
                <a
                  href={videoData.playUrlNoWm || videoData.playUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={`tiktok-preset-${videoData.id || "video"}.mp4`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Video TikTok (No Watermark MP4)</span>
                </a>
              )}
            </div>
          )}

          {/* TAB 3: Creator Profile Section */}
          {activeTab === "creator" && authorData && (
            <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-black/5 dark:border-white/10">
                <User className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-black dark:text-white">
                  Profil Kreator Preset
                </h3>
              </div>

              <div className="flex items-start gap-3.5">
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
                  <p className="text-xs text-[#007aff] dark:text-[#0a84ff] font-medium">
                    @{authorData.uniqueId}
                  </p>

                  {authorData.bio && (
                    <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-1.5 whitespace-pre-line leading-relaxed">
                      {authorData.bio}
                    </p>
                  )}

                  {authorData.bioLink && (
                    <a
                      href={authorData.bioLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:underline cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{authorData.bioLink}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Other Links Found */}
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
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/10 text-xs text-black dark:text-white transition-colors cursor-pointer"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#8e8e93] shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic Stats */}
              {result.data.scanned && (
                <div className="p-3 bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl flex items-center justify-between text-xs text-[#8e8e93]">
                  <span>{result.data.scanned.comments || 0} komentar dipindai</span>
                  <span>Waktu respons: {result.elapsed_ms || 0} ms</span>
                </div>
              )}
            </div>
          )}

          {/* Main Action Buttons Grid (Harmonized with AutoTrace Buttons Grid) */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-2.5">
              {first5MbLink ? (
                <a
                  href={first5MbLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>Buka di Alight Motion</span>
                </a>
              ) : (
                <button
                  onClick={handleCopyAllPresets}
                  className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-[#007aff] dark:bg-[#0a84ff] hover:bg-[#0062cc] dark:hover:bg-[#0071e3] text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin Semua Preset</span>
                </button>
              )}

              <button
                onClick={handleCopyAllPresets}
                className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white font-semibold text-xs sm:text-sm transition-all border border-black/5 dark:border-white/10 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Tautan Preset</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {videoData?.playUrlNoWm ? (
                <a
                  href={videoData.playUrlNoWm}
                  target="_blank"
                  rel="noreferrer"
                  download={`tiktok-preset-${videoData.id || "video"}.mp4`}
                  className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Video (No-WM)</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c1e] opacity-50 border border-black/10 dark:border-white/10 text-xs font-semibold text-black dark:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Video Tidak Tersedia</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (videoData?.url || inputUrl) {
                    handleCopy(videoData?.url || inputUrl, "tiktok-url", "Link video TikTok disalin!");
                  }
                }}
                className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-black dark:text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Link TikTok</span>
              </button>
            </div>

            <button
              onClick={() => setIsDataModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium text-[#8e8e93] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>Lihat Data Mentah Respons Preset (JSON)</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Raw Data Modal Inspector (Harmonized with AutoTrace XML Modal) */}
      {isDataModalOpen && result && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 flex flex-col h-full max-h-[90vh] max-w-2xl mx-auto w-full shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#007aff]" />
                <h4 className="text-sm font-bold text-black dark:text-white">Data Mentah Alight Motion Preset</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopy(JSON.stringify(result, null, 2), "modal-json", "JSON respons disalin!")
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#007aff] text-white font-bold text-xs cursor-pointer"
                >
                  Salin JSON
                </button>
                <button
                  onClick={() => setIsDataModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#8e8e93] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={JSON.stringify(result, null, 2)}
              className="flex-1 mt-3 bg-slate-50 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-black dark:text-white resize-none focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification (Identical to AutoTrace) */}
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
              <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-200" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
