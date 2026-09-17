import React, { useState, useRef } from "react";
import axios from "axios";
import {
  FileVideo,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Video,
  Music,
  Download,
  RefreshCw,
  CheckCircle2,
  Quote,
  Sparkles,
} from "lucide-react";
import { getProxiedVideoUrl, triggerVideoDownload, triggerDownload } from "../../services/api";
import { TikTokDownloadV2Response } from "../../types";

export const TikTokDownloaderV2Tool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TikTokDownloadV2Response | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "audio">("video");

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Mutual exclusion: pause audio when video plays
  const handleVideoPlay = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  };

  // Mutual exclusion: pause video when audio plays
  const handleAudioPlay = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  // Pause all playing media when tab is switched
  const handleTabChange = (tab: "video" | "audio") => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    setActiveMediaTab(tab);
  };

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError("Masukkan link video TikTok terlebih dahulu.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const res = await axios.get<TikTokDownloadV2Response>("/api/tiktok-dl-v2", {
        params: { url: cleanUrl },
        timeout: 45000,
      });

      if (res.data?.ok && (res.data.mp4 || res.data.mp3)) {
        setResult(res.data);
        // Default to video if available, else audio
        if (res.data.mp4) {
          setActiveMediaTab("video");
        } else if (res.data.mp3) {
          setActiveMediaTab("audio");
        }
      } else {
        setError(res.data?.message || "Gagal mengambil video dari sumber v2. Coba TikTok Downloader v1.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Terjadi kesalahan saat menghubungi server sumber v2.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidHdSource = !!result?.hd && /^https?:\/\//i.test(result.hd);
  const hasBothMedia = !!(result?.mp4 && result?.mp3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <FileVideo className="w-4 h-4" />
          <span>Social Media Downloader · Sumber Alternatif</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          TikTok Downloader V2
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Sumber unduhan cadangan untuk video TikTok tanpa watermark. Gunakan ini jika TikTok Downloader utama gagal memproses link.
        </p>
      </div>

      {/* Input Section */}
      <form onSubmit={handleDownload} className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-black dark:text-white mb-1.5">
            Link Video TikTok <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-[#8e8e93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="https://vt.tiktok.com/xxxxx/ atau https://www.tiktok.com/@user/video/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !url}
            className="w-full sm:w-auto px-6 py-2.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengambil Data Video...</span>
              </>
            ) : (
              <>
                <FileVideo className="w-4 h-4" />
                <span>Unduh Sekarang</span>
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
            <p className="font-semibold">Gagal Memproses Video</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-5 pt-2 animate-ios-fade">
          {/* Header Result & Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Media Berhasil Diproses
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {result.mp4 && (
                <button
                  onClick={() => triggerVideoDownload(result.mp4!, `fixio_tiktok_v2_${Date.now()}.mp4`)}
                  className="px-3 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh MP4
                </button>
              )}
              {hasValidHdSource && (
                <button
                  onClick={() => triggerVideoDownload(result.hd!, `fixio_tiktok_v2_hd_${Date.now()}.mp4`)}
                  className="px-3 py-1.5 ios-btn-glass text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer text-black dark:text-white border border-black/10 dark:border-white/15"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Unduh HD
                </button>
              )}
              {result.mp3 && (
                <button
                  onClick={() => triggerDownload(result.mp3!, `fixio_tiktok_v2_audio_${Date.now()}.mp3`)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh MP3
                </button>
              )}
              <button
                onClick={() => handleDownload()}
                className="text-xs font-semibold text-[#8e8e93] dark:text-[#98989d] hover:text-[#007aff] dark:hover:text-[#0a84ff] flex items-center gap-1 cursor-pointer p-1.5"
                title="Proses Ulang"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {result.caption && (
            <p className="text-xs sm:text-sm text-[#8e8e93] dark:text-[#98989d] flex items-start gap-2 bg-slate-50/70 dark:bg-[#121214] p-3.5 rounded-xl border border-black/5 dark:border-white/10">
              <Quote className="w-4 h-4 shrink-0 mt-0.5 text-[#007aff]" />
              <span className="italic">{result.caption}</span>
            </p>
          )}

          {/* iOS Segmented Media Switcher (Prevents Video/Audio Collision) */}
          {hasBothMedia && (
            <div className="flex bg-slate-200/70 dark:bg-[#1c1c1e] p-1 rounded-xl border border-black/5 dark:border-white/10 w-full sm:w-80 max-w-full">
              <button
                type="button"
                onClick={() => handleTabChange("video")}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMediaTab === "video"
                    ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                    : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Preview Video</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("audio")}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMediaTab === "audio"
                    ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                    : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Preview Audio</span>
              </button>
            </div>
          )}

          {/* Video Preview Card */}
          {result.mp4 && (activeMediaTab === "video" || !hasBothMedia) && (
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs animate-ios-fade">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#007aff]" /> Preview Video TikTok
                </h4>
                <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d] font-medium">
                  Format MP4 (Tanpa Watermark)
                </span>
              </div>
              <div className="bg-black rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
                <video
                  ref={videoRef}
                  key={result.mp4}
                  src={getProxiedVideoUrl(result.mp4)}
                  controls
                  playsInline
                  onPlay={handleVideoPlay}
                  className="max-h-[460px] w-auto max-w-full rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Audio Preview Card */}
          {result.mp3 && (activeMediaTab === "audio" || !hasBothMedia) && (
            <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl border border-black/5 dark:border-white/10 space-y-4 shadow-xs animate-ios-fade">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                      Preview Audio (Musik Asli)
                    </h4>
                    <p className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                      Format Audio MP3 Kualitas Jernih
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => triggerDownload(result.mp3!, `fixio_tiktok_v2_audio_${Date.now()}.mp3`)}
                  className="px-3.5 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh MP3
                </button>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-[#121214] rounded-xl border border-black/5 dark:border-white/10">
                <audio
                  ref={audioRef}
                  controls
                  onPlay={handleAudioPlay}
                  className="w-full"
                  src={`/api/audio-proxy?url=${encodeURIComponent(result.mp3)}`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
