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
  Calendar,
} from "lucide-react";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";
import { SpotifyDownloadResponse, SpotifyTrack } from "../../types";

export const SpotifyDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  const handleDownload = async (targetUrlOverride?: string) => {
    const cleanUrl = (targetUrlOverride || url).trim();
    if (!cleanUrl) {
      setError("Masukkan link track Spotify terlebih dahulu.");
      return;
    }

    if (targetUrlOverride) {
      setUrl(targetUrlOverride);
    }

    setError(null);
    setIsLoading(true);
    setTracks([]);

    try {
      let data: SpotifyDownloadResponse | null = null;
      try {
        const res = await axios.get<SpotifyDownloadResponse>("/api/spotify-dl", {
          params: { url: cleanUrl },
          timeout: 45000,
        });
        data = res.data;
      } catch (localErr: any) {
        // Direct fallback to API if local route encounters issues
        const fallbackUrl = `https://api.nexaadev.my.id/api/spotify?url=${encodeURIComponent(cleanUrl)}`;
        const fallbackRes = await axios.get<SpotifyDownloadResponse>(fallbackUrl, { timeout: 45000 });
        data = fallbackRes.data;
      }

      if (data?.ok && data.tracks && data.tracks.length > 0) {
        setTracks(data.tracks);
      } else {
        setError(data?.message || "Gagal mengambil lagu. Pastikan link track Spotify valid.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Terjadi kesalahan saat menghubungi server Spotify.");
    } finally {
      setIsLoading(false);
    }
  };

  const sampleTrackUrl =
    "https://open.spotify.com/track/5WOSNVChcadlsCRiqXE45K?si=medCM_2XT5-7ewU5h2yr0g&utm_source=copy-link";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Music2 className="w-4 h-4" />
          <span>Music Downloader</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Spotify Track Downloader
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Tempel link track Spotify untuk melihat detail lagu, mendengarkan preview, dan mengunduh audio dalam format MP3.
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
            Link Track Spotify <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-[#8e8e93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="https://open.spotify.com/track/xxxxx"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleDownload(sampleTrackUrl)}
              className="text-[11px] text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Contoh: Hindia - everything u are</span>
            </button>
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
                <span>Mengambil Data Lagu...</span>
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
            <p className="font-semibold">Gagal Memproses Lagu</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {tracks.length > 0 && (
        <div className="space-y-4 pt-2 animate-ios-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {tracks.length > 1 ? `${tracks.length} Lagu Ditemukan` : "Lagu Berhasil Diproses"}
            </h3>
            <button
              onClick={() => handleDownload()}
              className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Proses Ulang
            </button>
          </div>

          {tracks.map((track, idx) => (
            <div key={idx} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-[#121214] shrink-0">
                  {track.cover ? (
                    <img src={getProxiedImageUrl(track.cover)} alt={track.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8e8e93]">
                      <Disc3 className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">{track.name}</h4>
                  <p className="text-xs sm:text-sm text-[#8e8e93] dark:text-[#98989d] truncate">{track.artist}</p>
                  {track.album && (
                    <p className="text-[11px] text-[#8e8e93] dark:text-[#98989d] truncate">Album: {track.album}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                    {track.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {track.duration}
                      </span>
                    )}
                    {track.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {track.year}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {track.mp3_url && (
                <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs font-semibold text-black dark:text-white">Preview Audio</span>
                    <button
                      onClick={() =>
                        triggerDownload(track.mp3_url!, `fixio_spotify_${(track.name || "track").replace(/[^a-z0-9]+/gi, "_")}_${Date.now()}.mp3`)
                      }
                      className="px-3 py-1.5 ios-btn-primary text-[11px] font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh MP3
                    </button>
                  </div>
                  <audio controls className="w-full" src={`/api/audio-proxy?url=${encodeURIComponent(track.mp3_url)}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
