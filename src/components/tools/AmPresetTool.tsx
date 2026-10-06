import React, { useState } from "react";
import {
  Film,
  Download,
  Copy,
  ExternalLink,
  Check,
  Play,
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Link as LinkIcon,
  User,
  Layers,
  FileCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Sliders,
  Maximize2,
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

export const AmPresetTool: React.FC = () => {
  const [inputUrl, setInputUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AmPresetData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const formatNumber = (num?: number): string => {
    if (!num && num !== 0) return "-";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  const handleSearch = async (urlToFetch?: string) => {
    const target = (urlToFetch || inputUrl).trim();
    if (!target) {
      setErrorMsg("Masukkan tautan video TikTok terlebih dahulu.");
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
      } else {
        setErrorMsg(
          data?.error || "Preset Alight Motion tidak ditemukan pada tautan video ini. Pastikan video memiliki preset di komentar atau bio."
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat mencari preset.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        handleSearch(text);
      }
    } catch {
      // Clipboard fallback
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => {
      setCopiedLink((prev) => (prev === id ? null : prev));
    }, 2500);
  };

  const presetLinks = result?.data?.presetLinks || [];
  const fiveMbPresets = presetLinks.filter((p) => p.type?.toLowerCase().includes("5mb") || p.url?.includes("alightcreative.com"));
  const xmlPresets = presetLinks.filter((p) => p.type?.toLowerCase().includes("xml") || !p.url?.includes("alightcreative.com"));
  const videoData = result?.data?.video;
  const authorData = result?.data?.authorDetail;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 font-sans text-neutral-100 pb-16 select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-neutral-950 shadow-md font-bold">
            <Film className="w-5 h-5 text-neutral-950" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Alight Motion Preset Finder
            </h1>
            <p className="text-xs text-neutral-400 font-medium">
              Ekstrak link Preset 5MB & File XML dari video TikTok
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="mt-4 space-y-2.5">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tempel tautan TikTok (https://vt.tiktok.com/...)"
              className="w-full bg-neutral-950/90 border border-neutral-700/80 rounded-xl px-3.5 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400/80 pr-20 transition-all font-mono shadow-inner"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {inputUrl ? (
                <button
                  onClick={() => setInputUrl("")}
                  className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                >
                  Hapus
                </button>
              ) : (
                <button
                  onClick={handlePaste}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-200 border border-neutral-700 transition-colors"
                >
                  Paste
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memindai Komentar & Bio...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Cari Preset Alight Motion</span>
                </>
              )}
            </button>

            {/* Quick Demo */}
            <button
              onClick={() => {
                const demoUrl = "https://vt.tiktok.com/ZSbQn3Sys/";
                setInputUrl(demoUrl);
                handleSearch(demoUrl);
              }}
              title="Coba Contoh Preset"
              className="px-3 min-h-[44px] rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] font-medium text-neutral-300 transition-colors shrink-0"
            >
              Demo
            </button>
          </div>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3.5 flex items-start gap-3 text-red-200 text-xs shadow-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">Pencarian Belum Menemukan Preset</p>
            <p className="text-red-400/90 leading-relaxed text-[11px]">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Result Container */}
      {result && result.data && (
        <div className="space-y-3.5 animate-fade-in">
          {/* Preset Links Section */}
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Tautan Preset Ditemukan ({presetLinks.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                Oleh {result.data.author || "Kreator"}
              </span>
            </div>

            {/* List of Found Presets */}
            <div className="space-y-2.5">
              {presetLinks.map((preset, index) => {
                const is5Mb = preset.type?.toLowerCase().includes("5mb") || preset.url?.includes("alightcreative.com");
                const uniqueId = `preset-${index}`;
                const hasUrl = Boolean(preset.url);

                return (
                  <div
                    key={uniqueId}
                    className="bg-neutral-950/80 border border-neutral-800/90 hover:border-neutral-700 rounded-xl p-3.5 transition-all shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            is5Mb
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                          }`}
                        >
                          {is5Mb ? <Film className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              {preset.title || (is5Mb ? "Preset 5MB" : "Preset XML")}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                is5Mb
                                  ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                  : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                              }`}
                            >
                              {preset.type?.toUpperCase() || (is5Mb ? "5MB LINK" : "XML")}
                            </span>
                            {preset.ratio && (
                              <span className="text-[9px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded">
                                {preset.ratio}
                              </span>
                            )}
                            {preset.size && (
                              <span className="text-[9px] font-mono bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded">
                                {preset.size}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                            Sumber: {preset.source || "Komentar"} {preset.detail ? `(${preset.detail})` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      {preset.verified && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full shrink-0">
                          <Check className="w-3 h-3" /> Terverifikasi
                        </span>
                      )}
                    </div>

                    {/* Thumbnail previews if available */}
                    {preset.thumb && (
                      <div className="relative rounded-lg overflow-hidden border border-neutral-800 h-28 bg-neutral-900">
                        <img
                          src={preset.thumb}
                          alt="Preset Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] text-neutral-200 font-mono">
                            Pratinjau Alight Creative
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons for this Preset */}
                    {hasUrl ? (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={preset.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs transition-all shadow-sm ${
                            is5Mb
                              ? "bg-emerald-400 text-neutral-950 hover:bg-emerald-300"
                              : "bg-cyan-400 text-neutral-950 hover:bg-cyan-300"
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{is5Mb ? "Buka di Alight Motion" : "Unduh / Buka Preset XML"}</span>
                        </a>

                        <button
                          onClick={() => handleCopy(preset.url, uniqueId)}
                          className="p-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
                          title="Salin Tautan"
                        >
                          {copiedLink === uniqueId ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-center text-xs text-neutral-400">
                        Tautan XML berada di deskripsi atau bio kreator (cek di bagian bawah).
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TikTok Video Preview & Player */}
          {videoData && (
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Pratinjau Video TikTok</h3>
                </div>
                {videoData.playUrlNoWm && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-full">
                    No Watermark HD
                  </span>
                )}
              </div>

              {/* Video Player */}
              {(videoData.playUrlNoWm || videoData.playUrl) && (
                <div className="rounded-xl overflow-hidden bg-black border border-neutral-800 max-h-96 flex items-center justify-center relative">
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
                <p className="text-xs text-neutral-300 leading-relaxed font-sans line-clamp-3">
                  {videoData.description}
                </p>
              )}

              {/* Video Stats Grid */}
              {videoData.stats && (
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-neutral-800/60">
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" /> Views
                    </p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">
                      {formatNumber(videoData.stats.views)}
                    </p>
                  </div>
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3 text-red-400" /> Likes
                    </p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">
                      {formatNumber(videoData.stats.likes)}
                    </p>
                  </div>
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <MessageCircle className="w-3 h-3 text-emerald-400" /> Komentar
                    </p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">
                      {formatNumber(videoData.stats.comments)}
                    </p>
                  </div>
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
                      <Share2 className="w-3 h-3 text-amber-400" /> Share
                    </p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">
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
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Video TikTok (No Watermark)</span>
                </a>
              )}
            </div>
          )}

          {/* Author Details Card */}
          {authorData && (
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Profil Pembuat Preset</h3>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {authorData.avatar && (
                  <img
                    src={authorData.avatar}
                    alt={authorData.uniqueId || "Creator"}
                    className="w-12 h-12 rounded-full border border-neutral-700 object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {authorData.nickname || authorData.uniqueId}
                  </h4>
                  <p className="text-xs font-mono text-emerald-400">@{authorData.uniqueId}</p>

                  {authorData.bio && (
                    <p className="text-xs text-neutral-300 mt-1 whitespace-pre-line leading-relaxed">
                      {authorData.bio}
                    </p>
                  )}

                  {authorData.bioLink && (
                    <a
                      href={authorData.bioLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-cyan-400 hover:underline"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{authorData.bioLink}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Other Links Found */}
              {result.data.otherLinks && result.data.otherLinks.length > 0 && (
                <div className="pt-2 border-t border-neutral-800/70">
                  <p className="text-[11px] font-mono text-neutral-400 mb-1.5">
                    Tautan Lain di Bio / Deskripsi:
                  </p>
                  <div className="space-y-1">
                    {result.data.otherLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 hover:bg-neutral-800/80 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scan Diagnostics */}
          {result.data.scanned && (
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>{result.data.scanned.comments || 0} komentar dipindai</span>
              <span>Waktu proses: {result.elapsed_ms || 0} ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
