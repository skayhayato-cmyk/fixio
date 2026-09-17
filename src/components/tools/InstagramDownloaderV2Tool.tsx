import React, { useState, useRef } from "react";
import axios from "axios";
import {
  DownloadCloud,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  Music,
  Download,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { getProxiedVideoUrl, getProxiedImageUrl, triggerVideoDownload, triggerDownload } from "../../services/api";
import { InstagramDownloadV2Response } from "../../types";

export const InstagramDownloaderV2Tool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstagramDownloadV2Response | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<"video" | "image" | "audio">("video");

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const pauseAllMedia = () => {
    videoRefs.current.forEach((v) => {
      if (v && !v.paused) v.pause();
    });
    audioRefs.current.forEach((a) => {
      if (a && !a.paused) a.pause();
    });
  };

  const handleVideoPlay = (index: number) => {
    // Pause other videos and all audios
    videoRefs.current.forEach((v, idx) => {
      if (idx !== index && v && !v.paused) v.pause();
    });
    audioRefs.current.forEach((a) => {
      if (a && !a.paused) a.pause();
    });
  };

  const handleAudioPlay = (index: number) => {
    // Pause all videos and other audios
    videoRefs.current.forEach((v) => {
      if (v && !v.paused) v.pause();
    });
    audioRefs.current.forEach((a, idx) => {
      if (idx !== index && a && !a.paused) a.pause();
    });
  };

  const handleTabChange = (tab: "video" | "image" | "audio") => {
    pauseAllMedia();
    setActiveMediaTab(tab);
  };

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError("Masukkan link postingan Instagram terlebih dahulu.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      const res = await axios.get<InstagramDownloadV2Response>("/api/instagram-dl-v2", {
        params: { url: cleanUrl },
        timeout: 45000,
      });

      const videosList = res.data?.media?.video || [];
      const imagesList = res.data?.media?.image || [];
      const audiosList = res.data?.media?.audio || [];

      if (res.data?.ok && (videosList.length > 0 || imagesList.length > 0 || audiosList.length > 0)) {
        setResult(res.data);
        if (videosList.length > 0) setActiveMediaTab("video");
        else if (imagesList.length > 0) setActiveMediaTab("image");
        else if (audiosList.length > 0) setActiveMediaTab("audio");
      } else {
        setError(res.data?.message || "Gagal mengambil media dari sumber v2. Coba Instagram Downloader v1.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Terjadi kesalahan saat menghubungi server sumber v2.");
    } finally {
      setIsLoading(false);
    }
  };

  const videos = result?.media?.video || [];
  const images = result?.media?.image || [];
  const audios = result?.media?.audio || [];

  const availableTabs: Array<"video" | "image" | "audio"> = [];
  if (videos.length > 0) availableTabs.push("video");
  if (images.length > 0) availableTabs.push("image");
  if (audios.length > 0) availableTabs.push("audio");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <DownloadCloud className="w-4 h-4" />
          <span>Social Media Downloader · Sumber Alternatif</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Instagram Downloader V2
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Sumber unduhan cadangan untuk Reels, video, dan foto Instagram. Gunakan ini jika Instagram Downloader utama gagal memproses link.
        </p>
      </div>

      {/* Input Section */}
      <form onSubmit={handleDownload} className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-black dark:text-white mb-1.5">
            Link Postingan Instagram <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-[#8e8e93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="https://www.instagram.com/reel/xxxxx/ atau https://www.instagram.com/p/xxxxx/"
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
                <span>Mengambil Data Media...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4" />
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
            <p className="font-semibold">Gagal Memproses Postingan</p>
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
              {videos.map((vid, idx) => (
                <button
                  key={`btn-v-${idx}`}
                  onClick={() => triggerVideoDownload(vid.url, vid.filename || `fixio_ig_v2_${idx + 1}_${Date.now()}.mp4`)}
                  className="px-3 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh MP4 {videos.length > 1 ? `#${idx + 1}` : ""}
                </button>
              ))}
              {audios.map((aud, idx) => (
                <button
                  key={`btn-a-${idx}`}
                  onClick={() => triggerDownload(aud.url, aud.filename || `fixio_ig_v2_audio_${idx + 1}_${Date.now()}.mp3`)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh MP3 {audios.length > 1 ? `#${idx + 1}` : ""}
                </button>
              ))}
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
              {videos.length > 0 && (
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
                  <span>Video ({videos.length})</span>
                </button>
              )}
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange("image")}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeMediaTab === "image"
                      ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                      : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Foto ({images.length})</span>
                </button>
              )}
              {audios.length > 0 && (
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
                  <span>Audio ({audios.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (activeMediaTab === "video" || availableTabs.length <= 1) && (
            <div className="space-y-4 animate-ios-fade">
              {videos.map((vid, idx) => (
                <div key={`v-${idx}`} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#007aff]" /> {videos.length > 1 ? `Preview Video ${idx + 1}` : "Preview Video"}
                    </h4>
                    <button
                      onClick={() => triggerVideoDownload(vid.url, vid.filename || `fixio_ig_v2_${idx + 1}_${Date.now()}.mp4`)}
                      className="px-3 py-1.5 ios-btn-primary text-[11px] font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> MP4
                    </button>
                  </div>
                  <div className="bg-black rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={getProxiedVideoUrl(vid.url)}
                      controls
                      playsInline
                      onPlay={() => handleVideoPlay(idx)}
                      className="max-h-[460px] w-auto max-w-full rounded-xl"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (activeMediaTab === "image" || availableTabs.length <= 1) && (
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs animate-ios-fade">
              <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#007aff]" /> Foto Instagram ({images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={`i-${idx}`} className="relative group rounded-xl overflow-hidden border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-[#121214]">
                    <img src={getProxiedImageUrl(img.url)} alt={`Foto ${idx + 1}`} className="w-full h-40 object-cover" />
                    <button
                      onClick={() => triggerDownload(img.url, img.filename || `fixio_ig_v2_foto_${idx + 1}_${Date.now()}.jpg`)}
                      className="absolute bottom-2 right-2 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-black/75 shadow-sm"
                    >
                      <Download className="w-3 h-3" /> JPG
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio */}
          {audios.length > 0 && (activeMediaTab === "audio" || availableTabs.length <= 1) && (
            <div className="space-y-4 animate-ios-fade">
              {audios.map((aud, idx) => (
                <div key={`a-${idx}`} className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl border border-black/5 dark:border-white/10 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                          Preview Audio {audios.length > 1 ? `#${idx + 1}` : ""}
                        </h4>
                        <p className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                          Format Audio MP3
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => triggerDownload(aud.url, aud.filename || `fixio_ig_v2_audio_${Date.now()}.mp3`)}
                      className="px-3.5 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh MP3
                    </button>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-[#121214] rounded-xl border border-black/5 dark:border-white/10">
                    <audio
                      ref={(el) => {
                        audioRefs.current[idx] = el;
                      }}
                      controls
                      onPlay={() => handleAudioPlay(idx)}
                      className="w-full"
                      src={`/api/audio-proxy?url=${encodeURIComponent(aud.url)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
