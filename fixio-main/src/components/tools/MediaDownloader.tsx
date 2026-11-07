import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Download,
  Video,
  Music,
  Image as ImageIcon,
  Disc3,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Calendar,
  Layers,
  FileVideo,
  ArrowRight,
  ClipboardPaste,
  Trash2,
} from "lucide-react";
import {
  fetchProxiedJson,
  getProxiedImageUrl,
  getProxiedVideoUrl,
  downloadMedia,
} from "../../services/api";

export type DetectedPlatform = "tiktok" | "instagram" | "spotify" | "unknown";

export interface MediaItem {
  id: string;
  type: "video" | "audio" | "image";
  url: string;
  quality?: "HD" | "SD" | "320kbps" | "Original" | string;
  thumbnail?: string;
  filename: string;
  mimeType: "video/mp4" | "audio/mpeg" | "image/jpeg";
  sizeLabel?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: string;
  year?: number | string;
}

interface MediaDownloaderProps {
  initialPlatform?: DetectedPlatform;
}

export const MediaDownloader: React.FC<MediaDownloaderProps> = ({
  initialPlatform,
}) => {
  const [url, setUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<DetectedPlatform>(
    initialPlatform || "unknown"
  );
  const [detectedPlatform, setDetectedPlatform] = useState<DetectedPlatform>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaInfo, setMetaInfo] = useState<{
    platform: string;
    author?: string;
    caption?: string;
    title?: string;
    cover?: string;
  } | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedPreviews, setFailedPreviews] = useState<Set<string>>(new Set());

  // Smart URL parser & platform detector
  const detectPlatformFromUrl = (rawUrl: string): DetectedPlatform => {
    const clean = rawUrl.trim().toLowerCase();
    if (!clean) return "unknown";

    if (
      clean.includes("tiktok.com") ||
      clean.includes("douyin.com") ||
      clean.includes("vt.tiktok") ||
      clean.includes("vm.tiktok")
    ) {
      return "tiktok";
    }

    if (
      clean.includes("instagram.com") ||
      clean.includes("instagr.am") ||
      clean.includes("/reel/") ||
      clean.includes("/p/")
    ) {
      return "instagram";
    }

    if (
      clean.includes("spotify.com") ||
      clean.includes("open.spotify") ||
      clean.includes("spotify.link")
    ) {
      return "spotify";
    }

    return "unknown";
  };

  useEffect(() => {
    const detected = detectPlatformFromUrl(url);
    setDetectedPlatform(detected);
    if (detected !== "unknown") {
      setSelectedPlatform(detected);
    }
  }, [url]);

  // Handle Clipboard Paste
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
        }
      }
    } catch {
      // Ignored
    }
  };

  // Sample URLs for quick test
  const sampleUrls: Record<string, { label: string; url: string; platform: DetectedPlatform }> = {
    tiktok: {
      label: "TikTok Video",
      url: "https://vt.tiktok.com/ZSV5rNPTq/",
      platform: "tiktok",
    },
    instagram: {
      label: "Instagram Reel",
      url: "https://www.instagram.com/reel/Dbzp_KGTxOI/?igsi=OXdiMmlpMjIyeDc5",
      platform: "instagram",
    },
    spotify: {
      label: "Spotify Track",
      url: "https://open.spotify.com/track/5vQSU3pxA9atqN6zMrcTU7?si=XtbNv3PmQ4Gtbz8Ts1tIAQ",
      platform: "spotify",
    },
  };

  const handleApplySample = (sampleKey: "tiktok" | "instagram" | "spotify") => {
    const item = sampleUrls[sampleKey];
    setUrl(item.url);
    setSelectedPlatform(item.platform);
    setError(null);
  };

  // Process TikTok API Responses (V1, V2, and TikWM fallback)
  const processTikTok = async (targetUrl: string): Promise<MediaItem[]> => {
    const res = await fetchProxiedJson<any>(`/api/sss?url=${encodeURIComponent(targetUrl)}`);
    const items: MediaItem[] = [];
    const timestamp = Date.now();

    if (!res) throw new Error("Tidak ada respon dari server TikTok downloader");

    let author = res.author || res.data?.author || "tiktok_creator";
    let caption = res.caption || res.data?.title || res.data?.caption || "";

    setMetaInfo({
      platform: "TikTok",
      author,
      caption,
    });

    // 1. Primary Video (res.mp4, res.play, res.video, res.data?.video, res.data?.play)
    const primaryVideo =
      res.mp4 ||
      res.play ||
      res.video ||
      (typeof res.data === "object" && !Array.isArray(res.data) ? (res.data?.video || res.data?.play) : null);

    if (primaryVideo && typeof primaryVideo === "string") {
      items.push({
        id: "tt-mp4",
        type: "video",
        url: primaryVideo,
        quality: "Standard MP4 (Tanpa Watermark)",
        filename: `tiktok_${author}_${timestamp}.mp4`,
        mimeType: "video/mp4",
        title: caption || "TikTok Video",
      });
    }

    // 2. HD Video (res.hd, res.hdplay, res.data?.videoHD, res.data?.hdplay)
    const hdVideo =
      res.hd ||
      res.hdplay ||
      (typeof res.data === "object" && !Array.isArray(res.data) ? (res.data?.videoHD || res.data?.hdplay) : null);

    // Strictly ensure hdVideo is an absolute http URL and not an ssstik internal /abc path
    if (
      hdVideo &&
      typeof hdVideo === "string" &&
      hdVideo.startsWith("http") &&
      !hdVideo.includes("/abc")
    ) {
      if (!items.some((i) => i.url === hdVideo)) {
        items.push({
          id: "tt-hd",
          type: "video",
          url: hdVideo,
          quality: "HD Quality MP4",
          filename: `tiktok_${author}_hd_${timestamp}.mp4`,
          mimeType: "video/mp4",
          title: caption || "TikTok HD Video",
        });
      }
    }

    // 3. Audio MP3 (res.mp3, res.music, res.data?.audio, res.data?.music)
    const audioUrl =
      res.mp3 ||
      res.music ||
      (typeof res.data === "object" && !Array.isArray(res.data) ? (res.data?.audio || res.data?.music) : null);

    if (audioUrl && typeof audioUrl === "string") {
      if (!items.some((i) => i.url === audioUrl)) {
        items.push({
          id: "tt-mp3",
          type: "audio",
          url: audioUrl,
          quality: "Audio MP3",
          filename: `tiktok_${author}_sound_${timestamp}.mp3`,
          mimeType: "audio/mpeg",
          title: "Original Sound",
          artist: author,
        });
      }
    }

    // 4. Photos / Carousel (res.images, res.photos, res.data?.photo, res.data?.images)
    const rawPhotos =
      res.images ||
      res.photos ||
      (typeof res.data === "object" && !Array.isArray(res.data) ? (res.data?.photo || res.data?.images) : null);

    if (rawPhotos) {
      const photos = Array.isArray(rawPhotos) ? rawPhotos : [rawPhotos];
      photos.forEach((photoUrl: string, idx: number) => {
        if (photoUrl && typeof photoUrl === "string" && !items.some((i) => i.url === photoUrl)) {
          items.push({
            id: `tt-photo-${idx}`,
            type: "image",
            url: photoUrl,
            quality: `Photo ${idx + 1}`,
            filename: `tiktok_${author}_slide_${idx + 1}_${timestamp}.jpg`,
            mimeType: "image/jpeg",
            title: `Slide Foto #${idx + 1}`,
          });
        }
      });
    }

    // 5. Array data handling (if res.data is Array)
    if (Array.isArray(res.data)) {
      res.data.forEach((item: any, idx: number) => {
        const itemUrl = item?.url || (typeof item === "string" ? item : null);
        if (itemUrl && !items.some((i) => i.url === itemUrl)) {
          const isVideo = item.type === "mp4" || item.type === "video" || itemUrl.includes(".mp4");
          const isAudio = item.type === "mp3" || item.type === "audio" || itemUrl.includes(".mp3");
          items.push({
            id: `tt-data-${idx}`,
            type: isAudio ? "audio" : isVideo ? "video" : "image",
            url: itemUrl,
            quality: item.quality || (isVideo ? "Video MP4" : isAudio ? "Audio MP3" : "Foto JPG"),
            filename: `tiktok_${author}_${idx + 1}_${timestamp}.${isAudio ? "mp3" : isVideo ? "mp4" : "jpg"}`,
            mimeType: isAudio ? "audio/mpeg" : isVideo ? "video/mp4" : "image/jpeg",
            title: item.title || `Media #${idx + 1}`,
            artist: isAudio ? author : undefined,
          });
        }
      });
    }

    // 6. Generic download array (if res.download is Array)
    if (Array.isArray(res.download)) {
      res.download.forEach((d: any, idx: number) => {
        const dlUrl = typeof d === "string" ? d : d?.url;
        if (dlUrl && typeof dlUrl === "string" && !items.some((i) => i.url === dlUrl)) {
          items.push({
            id: `tt-download-${idx}`,
            type: "video",
            url: dlUrl,
            quality: d.quality || `Server #${idx + 1}`,
            filename: `tiktok_${author}_server_${idx + 1}_${timestamp}.mp4`,
            mimeType: "video/mp4",
            title: caption || "TikTok Video",
          });
        }
      });
    }

    return items.filter(
      (item) => item.url && typeof item.url === "string" && item.url.startsWith("http") && !item.url.includes("/abc")
    );
  };

  // Process Instagram API Responses (SnapSave & IG V1)
  const processInstagram = async (targetUrl: string): Promise<MediaItem[]> => {
    const items: MediaItem[] = [];
    const timestamp = Date.now();

    // 1. Try SnapSave V2
    let res: any = null;
    try {
      res = await fetchProxiedJson<any>(`/api/sanapsave?url=${encodeURIComponent(targetUrl)}`);
    } catch {
      // fallback to V1
    }

    // 2. If no media, try IG V1
    if (!res || (!res.media && !res.data && !res.links)) {
      try {
        const v1Res = await fetchProxiedJson<any>(`/api/ig?url=${encodeURIComponent(targetUrl)}`);
        if (v1Res && (v1Res.data || v1Res.links)) {
          res = v1Res;
        }
      } catch {
        // Ignored
      }
    }

    if (!res) throw new Error("Gagal mengambil media Instagram dari URL ini.");

    const author = res.meta?.author || res.author || "instagram_post";
    const caption = res.meta?.caption || res.caption || "";

    setMetaInfo({
      platform: "Instagram",
      author,
      caption,
    });

    if (res.media) {
      if (Array.isArray(res.media.video)) {
        res.media.video.forEach((v: any, idx: number) => {
          if (v?.url) {
            items.push({
              id: `ig-video-${idx}`,
              type: "video",
              url: v.url,
              quality: v.quality || "MP4 Video",
              filename: v.filename || `instagram_${author}_reel_${idx + 1}_${timestamp}.mp4`,
              mimeType: "video/mp4",
              title: `Video Instagram #${idx + 1}`,
            });
          }
        });
      }

      if (Array.isArray(res.media.image)) {
        res.media.image.forEach((img: any, idx: number) => {
          if (img?.url) {
            items.push({
              id: `ig-img-${idx}`,
              type: "image",
              url: img.url,
              quality: "High Res JPG",
              filename: img.filename || `instagram_${author}_photo_${idx + 1}_${timestamp}.jpg`,
              mimeType: "image/jpeg",
              title: `Foto Instagram #${idx + 1}`,
            });
          }
        });
      }
    } else if (res.data && Array.isArray(res.data)) {
      res.data.forEach((item: any, idx: number) => {
        if (item?.url) {
          const isVideo = item.type === "mp4" || item.url.includes(".mp4") || item.type === "video";
          items.push({
            id: `ig-v1-${idx}`,
            type: isVideo ? "video" : "image",
            url: item.url,
            quality: isVideo ? "Video MP4" : "Foto JPG",
            filename: `instagram_${author}_${isVideo ? "video" : "photo"}_${idx + 1}_${timestamp}.${isVideo ? "mp4" : "jpg"}`,
            mimeType: isVideo ? "video/mp4" : "image/jpeg",
            title: `Item #${idx + 1}`,
          });
        }
      });
    } else if (res.links && Array.isArray(res.links)) {
      res.links.forEach((link: string, idx: number) => {
        const isVideo = link.includes(".mp4") || link.includes("video");
        items.push({
          id: `ig-link-${idx}`,
          type: isVideo ? "video" : "image",
          url: link,
          quality: isVideo ? "Video MP4" : "Foto JPG",
          filename: `instagram_${author}_${idx + 1}_${timestamp}.${isVideo ? "mp4" : "jpg"}`,
          mimeType: isVideo ? "video/mp4" : "image/jpeg",
          title: `Item #${idx + 1}`,
        });
      });
    }

    return items;
  };

  // Process Spotify API
  const processSpotify = async (targetUrl: string): Promise<MediaItem[]> => {
    let cleanUrl = targetUrl.trim();
    const trackIdMatch = cleanUrl.match(/(?:track\/|track:|^)([a-zA-Z0-9]{22})(?:[/?#\s]|$)/);
    if (trackIdMatch && trackIdMatch[1]) {
      cleanUrl = `https://open.spotify.com/track/${trackIdMatch[1]}`;
    }

    let res: any = null;
    try {
      const resp = await axios.get<any>("/api/spotify", {
        params: { url: cleanUrl },
        timeout: 35000,
      });
      res = resp.data;
    } catch {
      try {
        res = await fetchProxiedJson<any>(`https://api.nexadev.my.id/api/spotify/?url=${encodeURIComponent(cleanUrl)}`);
      } catch {
        res = null;
      }
    }
    const items: MediaItem[] = [];

    // Normalize either { status, data: { thumbnail, title, artist, duration, preview, url } } or { tracks: [...] }
    let tracksList: any[] = [];
    if (res?.data && res?.status) {
      tracksList = [
        {
          name: res.data.title || "Spotify Track",
          artist: res.data.artist || "Spotify",
          cover: res.data.thumbnail,
          duration: res.data.duration,
          preview: res.data.preview,
          mp3_url: res.data.url,
        },
      ];
    } else if (Array.isArray(res?.tracks) && res.tracks.length > 0) {
      tracksList = res.tracks;
    }

    if (tracksList.length === 0) {
      throw new Error(res?.message || "Lagu Spotify tidak ditemukan atau link tidak valid.");
    }

    const firstTrack = tracksList[0];
    setMetaInfo({
      platform: "Spotify",
      title: firstTrack.name,
      author: firstTrack.artist,
      caption: firstTrack.album ? `Album: ${firstTrack.album}` : undefined,
      cover: firstTrack.cover,
    });

    tracksList.forEach((track: any, idx: number) => {
      const mp3DownloadUrl = track.mp3_url || track.url;
      if (mp3DownloadUrl) {
        const trackTitle = track.name || `Track ${idx + 1}`;
        const artist = track.artist || "Artist";
        items.push({
          id: `spotify-track-${idx}`,
          type: "audio",
          url: mp3DownloadUrl,
          quality: "320kbps MP3",
          thumbnail: track.cover,
          filename: `${artist} - ${trackTitle}.mp3`,
          mimeType: "audio/mpeg",
          title: trackTitle,
          artist,
          album: track.album,
          duration: track.duration,
          year: track.year,
        });
      }
    });

    return items;
  };

  // Submit Handler
  const handleFetchMedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError("Masukkan tautan media (TikTok, Instagram, atau Spotify)");
      return;
    }

    // Auto-detect platform from the given URL with priority
    const detected = detectPlatformFromUrl(cleanUrl);
    let targetPlatform = detected !== "unknown" ? detected : selectedPlatform;
    if (targetPlatform === "unknown") {
      setError("Format URL tidak dikenali. Harap masukkan tautan TikTok, Instagram, atau Spotify yang valid.");
      return;
    }
    setSelectedPlatform(targetPlatform);

    setIsLoading(true);
    setError(null);
    setMediaItems([]);
    setMetaInfo(null);
    setFailedPreviews(new Set());

    try {
      let extracted: MediaItem[] = [];

      if (targetPlatform === "tiktok") {
        extracted = await processTikTok(cleanUrl);
      } else if (targetPlatform === "instagram") {
        extracted = await processInstagram(cleanUrl);
      } else if (targetPlatform === "spotify") {
        extracted = await processSpotify(cleanUrl);
      }

      if (!extracted || extracted.length === 0) {
        throw new Error(
          `Tidak dapat menemukan file media dari link ${targetPlatform.toUpperCase()} tersebut. Pastikan konten bersifat publik.`
        );
      }

      setMediaItems(extracted);
    } catch (err: any) {
      console.error("Downloader error:", err);
      let errMsg = "Gagal memproses media. Server penyedia mungkin sedang sibuk atau link kadaluarsa.";
      if (err?.message === "Network Error") {
        errMsg = "Gagal terhubung ke server pemroses media. Periksa koneksi internet Anda atau coba beberapa saat lagi.";
      } else {
        errMsg = err?.response?.data?.message || err?.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe file download via downloadMedia helper
  const handleDownloadItem = async (item: MediaItem) => {
    setDownloadingId(item.id);
    try {
      await downloadMedia(item.url, item.filename, item.mimeType);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  // Copy media direct link
  const handleCopyLink = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignored
    }
  };

  // Platform badges colors & icons
  const getPlatformDetails = (p: DetectedPlatform) => {
    switch (p) {
      case "tiktok":
        return {
          label: "TikTok",
          icon: Video,
          color: "text-rose-500",
          bgColor: "bg-rose-50 dark:bg-rose-950/40",
          borderColor: "border-rose-200 dark:border-rose-900/50",
          buttonGradient: "from-rose-600 to-pink-600",
        };
      case "instagram":
        return {
          label: "Instagram",
          icon: ImageIcon,
          color: "text-fuchsia-500",
          bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
          borderColor: "border-fuchsia-200 dark:border-fuchsia-900/50",
          buttonGradient: "from-fuchsia-600 to-rose-600",
        };
      case "spotify":
        return {
          label: "Spotify",
          icon: Disc3,
          color: "text-emerald-500",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
          borderColor: "border-emerald-200 dark:border-emerald-900/50",
          buttonGradient: "from-emerald-600 to-teal-600",
        };
      default:
        return {
          label: "Auto Detect",
          icon: Sparkles,
          color: "text-sky-500",
          bgColor: "bg-sky-50 dark:bg-sky-950/40",
          borderColor: "border-sky-200 dark:border-sky-900/50",
          buttonGradient: "from-sky-600 to-blue-600",
        };
    }
  };

  const activeMeta = getPlatformDetails(
    selectedPlatform !== "unknown" ? selectedPlatform : detectedPlatform
  );
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="border-b border-black/5 dark:border-white/10 pb-5">
        <div className="flex items-center gap-2 font-semibold text-sm mb-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${activeMeta.bgColor} ${activeMeta.color} border ${activeMeta.borderColor}`}
          >
            <ActiveIcon className="w-3.5 h-3.5" />
            {activeMeta.label}
          </span>
          <span className="text-slate-400 text-xs">• Smart Multi-Platform Media Extractor</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          All-in-One Media Downloader
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
          Unduh video TikTok tanpa watermark, reels & carousel foto Instagram, serta lagu Spotify 320kbps MP3
          secara instan dalam satu alat pintar.
        </p>
      </div>

      {/* Main Input Card */}
      <form
        onSubmit={handleFetchMedia}
        className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4"
      >
        {/* Platform Selection Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
          <span className="text-xs font-semibold text-slate-400">Target Platform:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedPlatform("unknown")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPlatform === "unknown"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              Auto Detect
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("tiktok")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPlatform === "tiktok"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Video className="w-3 h-3" /> TikTok
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("instagram")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPlatform === "instagram"
                  ? "bg-fuchsia-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <ImageIcon className="w-3 h-3" /> Instagram
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("spotify")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPlatform === "spotify"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Disc3 className="w-3 h-3" /> Spotify
            </button>
          </div>
        </div>

        {/* Input Field with Paste and Clear Button */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Tautan Media (TikTok, IG, atau Spotify) <span className="text-red-500">*</span>
          </label>
          <div className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="url"
                required
                placeholder="Tempel link https://vt.tiktok.com/... / https://instagram.com/... / https://open.spotify.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-4 pr-20 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-black text-slate-900 dark:text-white transition-all font-medium"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {url ? (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    title="Hapus"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Tempel dari Clipboard"
                    className="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className={`w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r ${activeMeta.buttonGradient} hover:opacity-95 active:scale-98 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengurai Media...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Ambil Media</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Sample Links */}
          <div className="flex flex-wrap items-center justify-between mt-3 text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Coba tautan sampel:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplySample("tiktok")}
                className="text-rose-500 hover:underline font-medium flex items-center gap-0.5"
              >
                TikTok Reel
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleApplySample("instagram")}
                className="text-fuchsia-500 hover:underline font-medium flex items-center gap-0.5"
              >
                Instagram Post
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleApplySample("spotify")}
                className="text-emerald-500 hover:underline font-medium flex items-center gap-0.5"
              >
                Spotify Track
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error Card */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Gagal Memproses Media</p>
            <p className="text-xs mt-1 leading-relaxed opacity-95">{error}</p>
            <button
              onClick={() => handleFetchMedia()}
              className="mt-2 text-xs font-semibold underline flex items-center gap-1 hover:opacity-80"
            >
              <RotateCcw className="w-3 h-3" /> Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Results Container */}
      {mediaItems.length > 0 && (
        <div className="bg-white dark:bg-[#121214] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
          {/* Result Header & Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {mediaItems.length} File Siap Diunduh
                </span>
                {metaInfo?.platform && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Sumber: {metaInfo.platform}
                  </span>
                )}
              </div>
              {metaInfo && (metaInfo.author || metaInfo.title) && (
                <div className="mt-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {metaInfo.title || metaInfo.author}
                  </h3>
                  {metaInfo.caption && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 max-w-xl">
                      {metaInfo.caption}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action: Download All / Primary item */}
            {mediaItems.length > 1 && (
              <button
                onClick={() => {
                  mediaItems.forEach((item, i) => {
                    setTimeout(() => handleDownloadItem(item), i * 600);
                  });
                }}
                className="self-start sm:self-auto px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                Unduh Semua ({mediaItems.length})
              </button>
            )}
          </div>

          {/* Dynamic Grid Rendering Based on Media Type */}
          <div
            className={`grid gap-6 ${
              mediaItems.length === 1
                ? "grid-cols-1 max-w-xl mx-auto"
                : mediaItems.every((m) => m.type === "audio")
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {mediaItems.map((item) => {
              const isVideo = item.type === "video";
              const isAudio = item.type === "audio";
              const isImage = item.type === "image";
              const isDownloading = downloadingId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-white/5 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm"
                >
                  <div className="space-y-3">
                    {/* Item Type & Quality Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        {isVideo && <Video className="w-3.5 h-3.5 text-rose-500" />}
                        {isAudio && <Music className="w-3.5 h-3.5 text-emerald-500" />}
                        {isImage && <ImageIcon className="w-3.5 h-3.5 text-fuchsia-500" />}
                        {item.quality || item.type.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleCopyLink(item)}
                        title="Salin Link Asli"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-[11px]"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Media Dynamic Preview */}
                    {isVideo && (
                      failedPreviews.has(item.id) ? (
                        <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 aspect-[9/16] max-h-[360px] mx-auto w-full">
                          <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Pratinjau langsung tidak dapat dimuat di peramban
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Gunakan tombol unduh di bawah untuk menyimpan file video ke perangkat Anda.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-black rounded-xl overflow-hidden shadow-inner max-h-[380px] aspect-[9/16] mx-auto flex items-center justify-center">
                          <video
                            src={getProxiedVideoUrl(item.url)}
                            controls
                            playsInline
                            preload="metadata"
                            onError={() => setFailedPreviews((prev) => new Set(prev).add(item.id))}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )
                    )}

                    {isImage && (
                      <div className="bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner max-h-[380px] aspect-square flex items-center justify-center">
                        <img
                          src={getProxiedImageUrl(item.url)}
                          alt={item.title || "Preview image"}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {isAudio && (
                      <div className="space-y-3 pt-1">
                        {item.thumbnail && (
                          <div className="flex items-start gap-3.5">
                            <img
                              src={getProxiedImageUrl(item.thumbnail)}
                              alt={item.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-sm bg-slate-200 dark:bg-slate-800 shrink-0 border border-black/5 dark:border-white/10"
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {item.title || "Track"}
                              </h4>
                              {item.artist && (
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                                  {item.artist}
                                </p>
                              )}
                              {item.album && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  Album: {item.album}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                                {item.duration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {item.duration}
                                  </span>
                                )}
                                {item.year && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {item.year}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="w-full pt-1">
                          {failedPreviews.has(item.id) ? (
                            <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>Pratinjau audio tidak dapat diputar langsung. Silakan klik tombol unduh di bawah.</span>
                            </div>
                          ) : (
                            <audio
                              src={`/api/audio-proxy?url=${encodeURIComponent(item.url)}`}
                              controls
                              preload="metadata"
                              onError={() => setFailedPreviews((prev) => new Set(prev).add(item.id))}
                              className="w-full h-9"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clean Download Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleDownloadItem(item)}
                      disabled={isDownloading}
                      className={`w-full py-3 bg-gradient-to-r ${
                        isVideo
                          ? "from-rose-600 to-pink-600"
                          : isAudio
                          ? "from-emerald-600 to-teal-600"
                          : "from-fuchsia-600 to-rose-600"
                      } hover:opacity-95 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75`}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengunduh...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>
                            Download {isVideo ? "MP4" : isAudio ? "MP3" : "JPG"}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-1 truncate px-1">
                      {item.filename}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
