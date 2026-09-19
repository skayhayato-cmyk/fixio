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
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";
import { SpotifyDownloadResponse, SpotifyTrack } from "../../types";

const SAMPLE_TRACKS = [
  {
    title: "Hindia - everything u are",
    url: "https://open.spotify.com/track/5WOSNVChcadlsCRiqXE45K?si=medCM_2XT5-7ewU5h2yr0g&utm_source=copy-link",
  },
  {
    title: "Nadhif - penjaga hati",
    url: "https://open.spotify.com/track/5vQSU3pxA9atqN6zMrcTU7?si=XtbNv3PmQ4Gtbz8Ts1tIAQ",
  },
  {
    title: "Bernadya - Satu Bulan",
    url: "https://open.spotify.com/track/2yN6U3k5oD1i9BvYk4g1rA",
  },
];

export const SpotifyDownloaderTool: React.FC = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  const handleDownload = async (targetUrlOverride?: string) => {
    // Jika tidak ada url, gunakan contoh default (bisa tanpa url manual)
    const rawUrl = (targetUrlOverride || url).trim();
    const cleanUrl = rawUrl || SAMPLE_TRACKS[0].url;

    if (!url.trim() && !targetUrlOverride) {
      setUrl(cleanUrl);
    } else if (targetUrlOverride) {
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

  const handleCopyLink = async (mp3Url: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(mp3Url);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignore
    }
  };

  const handleTriggerMp3 = async (track: SpotifyTrack, idx: number) => {
    if (!track.mp3_url) return;
    setDownloadingIndex(idx);
    try {
      const filename = `${track.artist || "Spotify"} - ${track.name || "Track"}.mp3`;
      await triggerDownload(track.mp3_url, filename);
    } finally {
      setTimeout(() => setDownloadingIndex(null), 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Music2 className="w-4 h-4" />
          <span>Spotify Music Downloader</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Spotify Track & MP3 Converter
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Unduh lagu Spotify berkualitas tinggi 320kbps MP3 lengkap dengan album cover thumbnail, nama lagu, artis, album, durasi, dan tahun rilis.
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
            Link Track Spotify (Atau pilih lagu contoh di bawah tanpa perlu copy link)
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-[#8e8e93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="https://open.spotify.com/track/xxxxx (Kosongkan untuk lagu contoh)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[11px] text-slate-400 font-medium">Contoh Siap Pakai:</span>
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
            <div
              key={idx}
              className="bg-white dark:bg-[#1c1c1e] p-4 sm:p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm space-y-4"
            >
              {/* Cover Thumbnail, Artist, Name, Album, Duration, Year */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Cover Thumbnail */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-[#121214] shrink-0 shadow-md">
                  {track.cover ? (
                    <img
                      src={getProxiedImageUrl(track.cover)}
                      alt={track.name}
                      className="w-full h-full object-cover"
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
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                      320kbps MP3
                    </span>
                    {track.year && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-full">
                        {track.year}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-black dark:text-white truncate">
                    {track.name || "Unknown Track"}
                  </h4>

                  <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                    {track.artist || "Unknown Artist"}
                  </p>

                  {track.album && (
                    <p className="text-xs text-[#8e8e93] dark:text-[#98989d] truncate">
                      Album: <span className="font-medium text-slate-800 dark:text-slate-200">{track.album}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-1 text-xs text-[#8e8e93] dark:text-[#98989d]">
                    {track.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Durasi: {track.duration}</span>
                      </span>
                    )}
                    {track.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Rilis: {track.year}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* MP3 Audio Player & Download Actions */}
              {track.mp3_url && (
                <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-black dark:text-white flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-emerald-500" />
                      Audio Preview (Stream)
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(track.mp3_url!, idx)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Link MP3</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={downloadingIndex === idx}
                        onClick={() => handleTriggerMp3(track, idx)}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 active:scale-98 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
                      >
                        {downloadingIndex === idx ? (
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
                  <div className="p-2 bg-slate-50 dark:bg-[#121214] rounded-xl border border-black/5 dark:border-white/10">
                    <audio
                      controls
                      preload="metadata"
                      className="w-full h-9"
                      src={`/api/audio-proxy?url=${encodeURIComponent(track.mp3_url)}`}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
