import React, { useState } from "react";
import axios from "axios";
import {
  Music2,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Download,
  RefreshCw,
  CheckCircle2,
  Disc3,
  Clock,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";
import { NexaSpotifyData, NexaSpotifyResponse } from "../../types";

const SAMPLE_TRACKS = [
  {
    title: "Westlife - Where We Are",
    url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
  },
  {
    title: "Hindia - everything u are",
    url: "https://open.spotify.com/track/5WOSNVChcadlsCRiqXE45K",
  },
  {
    title: "Coldplay - Yellow",
    url: "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg",
  },
];

export const SpotifyDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<NexaSpotifyData | null>(null);
  const [authorName, setAuthorName] = useState<string>("NexaDev");
  const [copiedMp3, setCopiedMp3] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (targetUrlOverride?: string) => {
    const rawUrl = (targetUrlOverride || url).trim();
    const cleanUrl = rawUrl || SAMPLE_TRACKS[0].url;

    if (!url.trim() && !targetUrlOverride) {
      setUrl(cleanUrl);
    } else if (targetUrlOverride) {
      setUrl(targetUrlOverride);
    }

    setError(null);
    setIsLoading(true);
    setTrackData(null);

    try {
      let result: NexaSpotifyResponse | null = null;

      // 1. Call dedicated proxy route /api/spotify
      try {
        const res = await axios.get<any>("/api/spotify", {
          params: { url: cleanUrl },
          timeout: 45000,
        });
        result = res.data;
      } catch (localErr: any) {
        // Fallback to /api/proxy-json with official NexaDev Spotify endpoint
        const targetEndpoint = `https://api.nexadev.my.id/api/spotify?url=${encodeURIComponent(cleanUrl)}`;
        const fallbackRes = await axios.get<any>("/api/proxy-json", {
          params: { url: targetEndpoint },
          timeout: 45000,
        });
        result = fallbackRes.data;
      }

      if (result?.status && result.data?.url) {
        setTrackData(result.data);
        if (result.author) setAuthorName(result.author);
      } else if ((result as any)?.tracks?.[0]?.mp3_url) {
        // Compatibility with normalized track item
        const first = (result as any).tracks[0];
        setTrackData({
          title: first.name,
          artist: first.artist,
          thumbnail: first.cover || first.thumbnail,
          duration: first.duration,
          preview: first.preview,
          url: first.mp3_url || first.url,
        });
        if (result?.author) setAuthorName(result.author);
      } else {
        setError(result?.message || "Gagal mengambil data lagu. Pastikan link track Spotify valid.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan saat menghubungi API Spotify NexaDev."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (textToCopy: string, isPreview: boolean = false) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (isPreview) {
        setCopiedPreview(true);
        setTimeout(() => setCopiedPreview(false), 2000);
      } else {
        setCopiedMp3(true);
        setTimeout(() => setCopiedMp3(false), 2000);
      }
    } catch {
      // Ignore
    }
  };

  const handleTriggerMp3 = async () => {
    if (!trackData?.url) return;
    setIsDownloading(true);
    try {
      const filename = `${trackData.artist || "Spotify"} - ${trackData.title || "Track"}.mp3`;
      await triggerDownload(trackData.url, filename);
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Music2 className="w-4 h-4" />
          <span>NexaDev Spotify Downloader</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Spotify Track & MP3 Converter
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Unduh lagu Spotify berkualitas tinggi 320kbps MP3 lengkap dengan album cover art, judul, artis, durasi, dan audio stream.
        </p>
      </div>

      {/* Input Section */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleDownload();
        }}
        className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10"
      >
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-black dark:text-white mb-1.5">
            Link Track Spotify (Atau pilih lagu contoh di bawah)
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-[#8e8e93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="https://open.spotify.com/track/xxxxx"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[11px] text-slate-400 font-medium">Contoh Lagu:</span>
            {SAMPLE_TRACKS.map((sample, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => handleDownload(sample.url)}
                className="text-[11px] px-2.5 py-1 bg-white dark:bg-[#1c1c1e] hover:bg-slate-100 dark:hover:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] border border-black/5 dark:border-white/10 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengambil Data & Convert MP3...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh MP3 Sekarang</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal Memproses Lagu</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {trackData && (
        <div className="space-y-4 pt-2 animate-ios-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Lagu Berhasil Diproses</span>
            </h3>
            <button
              onClick={() => handleDownload()}
              className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Proses Ulang
            </button>
          </div>

          <div className="bg-white dark:bg-[#1c1c1e] p-5 sm:p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm space-y-5">
            {/* Cover Thumbnail, Artist, Name, Duration */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              {/* Cover Thumbnail */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-[#121214] shrink-0 shadow-md relative group">
                {trackData.thumbnail ? (
                  <img
                    src={getProxiedImageUrl(trackData.thumbnail)}
                    alt={trackData.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8e8e93]">
                    <Disc3 className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Metadata Details */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                    320kbps MP3
                  </span>
                  <span className="px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-semibold rounded-full border border-sky-500/20">
                    {authorName}
                  </span>
                  {trackData.duration && (
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {trackData.duration}
                    </span>
                  )}
                </div>

                <h4 className="text-base sm:text-lg font-bold text-black dark:text-white leading-tight">
                  {trackData.title || "Unknown Track"}
                </h4>

                <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {trackData.artist || "Unknown Artist"}
                </p>

                {trackData.preview && (
                  <p className="text-[11px] text-[#8e8e93] dark:text-[#98989d] flex items-center gap-1 pt-0.5">
                    <Volume2 className="w-3 h-3 text-emerald-500" />
                    <span>Termasuk Spotify 30s Audio Preview & Full MP3 Download</span>
                  </p>
                )}
              </div>
            </div>

            {/* MP3 Audio Player & Actions */}
            <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-black dark:text-white flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-emerald-500" />
                  Pemutar Audio MP3
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(trackData.url, false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    {copiedMp3 ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Link MP3 Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Link MP3</span>
                      </>
                    )}
                  </button>

                  {trackData.preview && (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(trackData.preview!, true)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    >
                      {copiedPreview ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Preview Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-sky-500" />
                          <span>Salin Preview</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleTriggerMp3}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 active:scale-98 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunduh...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh File MP3</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* HTML5 Audio Player */}
              <div className="p-3 bg-slate-50 dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 space-y-2">
                <audio
                  controls
                  preload="metadata"
                  className="w-full h-10"
                  src={`/api/proxy-image?url=${encodeURIComponent(trackData.url)}`}
                />
                <div className="flex items-center justify-between text-[11px] text-[#8e8e93] dark:text-[#98989d] px-1">
                  <span>Audio Stream (MP3 320kbps)</span>
                  <a
                    href={trackData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#007aff] dark:text-[#0a84ff] hover:underline"
                  >
                    <span>Direct Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
