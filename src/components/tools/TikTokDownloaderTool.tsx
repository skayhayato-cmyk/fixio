import React, { useState, useRef } from "react";
import axios from "axios";
import {
  Download,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Video,
  Music,
  Image as ImageIcon,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getProxiedVideoUrl, getProxiedImageUrl, triggerVideoDownload, triggerDownload } from "../../services/api";
import { TikTokDownloadResponse } from "../../types";

export const TikTokDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TikTokDownloadResponse["data"] | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "audio" | "photo">("video");

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

  const handleTabChange = (tab: "video" | "audio" | "photo") => {
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
      const res = await axios.get<TikTokDownloadResponse>("/api/tiktok-dl", {
        params: { url: cleanUrl },
        timeout: 45000,
      });

      if (res.data?.status && res.data.data) {
        setResult(res.data.data);
        const photosList = Array.isArray(res.data.data.photo)
          ? res.data.data.photo
          : res.data.data.photo
          ? [res.data.data.photo]
          : [];
        if (res.data.data.videoHD || res.data.data.video) {
          setActiveMediaTab("video");
        } else if (photosList.length > 0) {
          setActiveMediaTab("photo");
        } else if (res.data.data.audio) {
          setActiveMediaTab("audio");
        }
      } else {
        setError(res.data?.message || "Gagal mengambil video. Pastikan link TikTok valid dan bersifat publik.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Terjadi kesalahan saat menghubungi server TikTok.");
    } finally {
      setIsLoading(false);
    }
  };

  const photos: string[] = Array.isArray(result?.photo)
    ? (result!.photo as string[]).filter(Boolean)
    : result?.photo
    ? [result.photo as string]
    : [];

  const bestVideo = result?.videoHD || result?.video || null;
  const availableTabs: Array<"video" | "audio" | "photo"> = [];
  if (bestVideo) availableTabs.push("video");
  if (result?.audio) availableTabs.push("audio");
  if (photos.length > 0) availableTabs.push("photo");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Download className="w-4 h-4" />
          <span>Social Media Downloader</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          TikTok Video & Foto Downloader
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Unduh video TikTok tanpa watermark dalam kualitas SD & HD (MP4), ekstrak audio (MP3), atau unduh slide foto (JPG) sekaligus.
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
                <Download className="w-4 h-4" />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Media Berhasil Diproses
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {result.videoHD && (
                <button
                  onClick={() => triggerVideoDownload(result.videoHD!, `fixio_tiktok_hd_${Date.now()}.mp4`)}
                  className="px-3 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Unduh HD (MP4)
                </button>
              )}
              {result.video && !result.videoHD && (
                <button
                  onClick={() => triggerVideoDownload(result.video!, `fixio_tiktok_sd_${Date.now()}.mp4`)}
                  className="px-3 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh MP4
                </button>
              )}
              {result.audio && (
                <button
                  onClick={() => triggerDownload(result.audio!, `fixio_tiktok_audio_${Date.now()}.mp3`)}
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

          {/* Segmented Media Tab Selector */}
          {availableTabs.length > 1 && (
            <div className="flex bg-slate-200/70 dark:bg-[#1c1c1e] p-1 rounded-xl border border-black/5 dark:border-white/10 w-full sm:w-96 max-w-full">
              {bestVideo && (
                <button
                  type="button"
                  onClick={() => handleTabChange("video")}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === "video"
                      ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                      : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              )}
              {result.audio && (
                <button
                  type="button"
                  onClick={() => handleTabChange("audio")}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === "audio"
                      ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                      : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio (MP3)</span>
                </button>
              )}
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange("photo")}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === "photo"
                      ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                      : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto ({photos.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Video Preview */}
          {bestVideo && (activeMediaTab === "video" || availableTabs.length <= 1) && (
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs animate-ios-fade">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#007aff]" /> Preview Video TikTok
                </h4>
                <div className="flex items-center gap-2">
                  {result.videoHD && (
                    <button
                      onClick={() => triggerVideoDownload(result.videoHD!, `fixio_tiktok_hd_${Date.now()}.mp4`)}
                      className="px-3 py-1.5 ios-btn-primary text-[11px] font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> HD MP4
                    </button>
                  )}
                  {result.video && (
                    <button
                      onClick={() => triggerVideoDownload(result.video!, `fixio_tiktok_sd_${Date.now()}.mp4`)}
                      className="px-3 py-1.5 ios-btn-glass text-[11px] font-semibold rounded-full flex items-center gap-1.5 cursor-pointer text-black dark:text-white border border-black/10 dark:border-white/15"
                    >
                      <Download className="w-3.5 h-3.5" /> SD MP4
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-black rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
                <video
                  ref={videoRef}
                  key={bestVideo}
                  src={getProxiedVideoUrl(bestVideo)}
                  controls
                  playsInline
                  onPlay={handleVideoPlay}
                  className="max-h-[460px] w-auto max-w-full rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Audio Preview */}
          {result.audio && (activeMediaTab === "audio" || availableTabs.length <= 1) && (
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
                  onClick={() => triggerDownload(result.audio!, `fixio_tiktok_audio_${Date.now()}.mp3`)}
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
                  src={`/api/audio-proxy?url=${encodeURIComponent(result.audio)}`}
                />
              </div>
            </div>
          )}

          {/* Photo Slide Preview */}
          {photos.length > 0 && (activeMediaTab === "photo" || availableTabs.length <= 1) && (
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs animate-ios-fade">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#007aff]" /> Slide Foto ({photos.length})
                </h4>
                <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                  Klik tombol JPG untuk menyimpan foto
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photoUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-[#121214]">
                    <img src={getProxiedImageUrl(photoUrl)} alt={`Foto ${idx + 1}`} className="w-full h-40 object-cover" />
                    <button
                      onClick={() => triggerDownload(photoUrl, `fixio_tiktok_foto_${idx + 1}_${Date.now()}.jpg`)}
                      className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-black/75 shadow-sm"
                    >
                      <Download className="w-3 h-3" /> JPG
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!bestVideo && !result.audio && photos.length === 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
              Tidak ada media yang bisa ditampilkan dari link ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
