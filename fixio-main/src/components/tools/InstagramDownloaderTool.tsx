import React, { useState } from "react";
import axios from "axios";
import {
  Instagram,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  Download,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { getProxiedVideoUrl, getProxiedImageUrl, triggerVideoDownload, triggerDownload } from "../../services/api";
import { InstagramDownloadItem, InstagramDownloadResponse } from "../../types";

export const InstagramDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InstagramDownloadItem[]>([]);

  const isVideo = (type: string) => /mp4|video/i.test(type);

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError("Masukkan link postingan Instagram terlebih dahulu.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setItems([]);

    try {
      const res = await axios.get<InstagramDownloadResponse>("/api/instagram-dl", {
        params: { url: cleanUrl },
        timeout: 45000,
      });

      if (res.data?.status && res.data.data && res.data.data.length > 0) {
        setItems(res.data.data);
      } else {
        setError(res.data?.message || "Gagal mengambil media. Pastikan link Instagram valid dan bersifat publik.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Terjadi kesalahan saat menghubungi server Instagram.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Instagram className="w-4 h-4" />
          <span>Social Media Downloader</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Instagram Reels & Foto Downloader
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Unduh Reels, video, atau foto dari postingan Instagram publik dalam kualitas asli (MP4 / JPG).
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
              placeholder="https://www.instagram.com/reel/xxxxx/"
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
            className="w-full sm:w-auto px-6 py-2.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengambil Data Media...</span>
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
            <p className="font-semibold">Gagal Memproses Postingan</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {items.length > 0 && (
        <div className="space-y-4 pt-2 animate-ios-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {items.length > 1 ? `${items.length} Media Ditemukan` : "Media Berhasil Diproses"}
            </h3>
            <button
              onClick={() => handleDownload()}
              className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Proses Ulang
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-semibold text-black dark:text-white flex items-center gap-2">
                    {isVideo(item.type) ? (
                      <Video className="w-4 h-4 text-[#007aff]" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-[#007aff]" />
                    )}
                    {items.length > 1 ? `Media ${idx + 1}` : isVideo(item.type) ? "Preview Video" : "Preview Foto"}
                  </h4>
                  <button
                    onClick={() =>
                      isVideo(item.type)
                        ? triggerVideoDownload(item.url, `fixio_ig_${idx + 1}_${Date.now()}.mp4`)
                        : triggerDownload(item.url, `fixio_ig_${idx + 1}_${Date.now()}.jpg`)
                    }
                    className="px-3 py-1.5 ios-btn-primary text-[11px] font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> {isVideo(item.type) ? "MP4" : "JPG"}
                  </button>
                </div>

                <div className="bg-black rounded-xl flex items-center justify-center overflow-hidden">
                  {isVideo(item.type) ? (
                    <video src={getProxiedVideoUrl(item.url)} controls className="max-h-[360px] w-auto max-w-full rounded-xl" />
                  ) : (
                    <img src={getProxiedImageUrl(item.url)} alt={`Foto ${idx + 1}`} className="max-h-[360px] w-auto max-w-full object-contain rounded-xl" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
