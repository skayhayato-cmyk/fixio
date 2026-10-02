import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Film,
  Type,
  Copy,
  Check,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Sliders,
  Eye,
  Video,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Music,
  Loader2,
  ChevronDown,
  ChevronUp,
  Tag,
  Compass,
  Palette,
} from "lucide-react";
import { parseCommand } from "../../services/storyEditTypes";

interface PresetItem {
  id: string;
  label: string;
  rawText: string;
  title: string;
  tags: string[];
  author: string;
  sampleVideo: string;
}

const PRESET_LIST: PresetItem[] = [
  {
    id: "nature",
    label: "Nature's Whisper",
    rawText: "Nature's whisper | Healing, Serenity, Escapism",
    title: "Nature's whisper",
    tags: ["Healing", "Serenity", "Escapism"],
    author: "nexadev",
    sampleVideo: "/samples/nature.mp4",
  },
  {
    id: "sunset",
    label: "The Sunset Vibes",
    rawText: "The sunset vibes | Healing, Vitaminsea, Addict",
    title: "The sunset vibes",
    tags: ["Healing", "Vitaminsea", "Addict"],
    author: "nexadev",
    sampleVideo: "/samples/sunset.mp4",
  },
  {
    id: "twilight",
    label: "Urban Twilight",
    rawText: "Urban twilight | Cityscape, Nightlife, Cinematic",
    title: "Urban twilight",
    tags: ["Cityscape", "Nightlife", "Cinematic"],
    author: "nexadev",
    sampleVideo: "/samples/sunset.mp4",
  },
  {
    id: "morning",
    label: "Morning Coffee",
    rawText: "Morning coffee | Mindful, Productivity, Peace",
    title: "Morning coffee",
    tags: ["Mindful", "Productivity", "Peace"],
    author: "nexadev",
    sampleVideo: "/samples/nature.mp4",
  },
];

export const StoryEditTool: React.FC = () => {
  // Main typography text input
  const [rawText, setRawText] = useState("Nature's whisper | Healing, Serenity, Escapism");
  const [author, setAuthor] = useState("nexadev");
  const [videoSourceType, setVideoSourceType] = useState<"preset" | "upload" | "url">("preset");
  const [selectedPresetVideo, setSelectedPresetVideo] = useState("/samples/nature.mp4");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  
  // Customization options
  const [width, setWidth] = useState<number>(540); // 540x960 fast or 720x1280 HD
  const [duration, setDuration] = useState<number>(8);
  const [scriptFirstWord, setScriptFirstWord] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Copy feedback state
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedResultUrl, setCopiedResultUrl] = useState<boolean>(false);

  // Rendering state
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStep, setRenderStep] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderedResult, setRenderedResult] = useState<{
    videoUrl: string;
    filename: string;
    title: string;
    tags: string[];
    author: string;
    duration: number;
  } | null>(null);

  // Live Canvas Preview state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [previewTime, setPreviewTime] = useState<number>(3.5);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Parsed metadata
  const parsedData = useMemo(() => {
    return parseCommand(rawText);
  }, [rawText]);

  // Current effective video URL for preview
  const currentVideoSrc = useMemo(() => {
    if (videoSourceType === "upload" && uploadedVideoUrl) {
      return uploadedVideoUrl;
    }
    if (videoSourceType === "url" && customVideoUrl.trim()) {
      return customVideoUrl.trim();
    }
    return selectedPresetVideo;
  }, [videoSourceType, uploadedVideoUrl, customVideoUrl, selectedPresetVideo]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
        setRenderError("Harap pilih file video dengan format MP4.");
        return;
      }
      setUploadedFile(file);
      const objUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(objUrl);
      setVideoSourceType("upload");
      setRenderError(null);
    }
  };

  // Copy raw typography text
  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy result URL
  const handleCopyResultUrl = async (url: string) => {
    try {
      const fullUrl = window.location.origin + url;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedResultUrl(true);
      setTimeout(() => setCopiedResultUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Apply preset
  const handleSelectPreset = (p: PresetItem) => {
    setRawText(p.rawText);
    setAuthor(p.author);
    if (videoSourceType === "preset") {
      setSelectedPresetVideo(p.sampleVideo);
    }
    setRenderError(null);
  };

  // Draw overlay preview on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 360;
    const H = 640;
    canvas.width = W;
    canvas.height = H;

    const S = W / 720;
    const F = {
      x: 30 * S,
      y: 44 * S,
      w: W - 60 * S,
      h: H - 88 * S,
      cx: W / 2,
    };
    const Y = (k: number) => F.y + F.h * k;

    const t = previewTime;
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const seg = (val: number, a: number, b: number) => clamp((val - a) / (b - a));
    const lerp = (a: number, b: number, factor: number) => a + (b - a) * factor;
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeOutBack = (x: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    const rrect = (x: number, y: number, w: number, h: number, r: number) => {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    ctx.clearRect(0, 0, W, H);

    // 1. Backdrop
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(0,10,32,0.50)");
    g.addColorStop(0.5, "rgba(0,10,32,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 2. Frame Border
    const pf = easeOutCubic(seg(t, 0, 0.7));
    if (pf > 0) {
      ctx.save();
      ctx.globalAlpha = pf;
      const sc = lerp(1.05, 1, pf);
      const cy = F.y + F.h / 2;
      ctx.translate(F.cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-F.cx, -cy);

      rrect(F.x, F.y, F.w, F.h, 46 * S);
      ctx.fillStyle = "rgba(120,160,230,0.08)";
      ctx.fill();

      ctx.shadowColor = "rgba(190,220,255,0.7)";
      ctx.shadowBlur = 12 * S;
      ctx.lineWidth = 2.5 * S;
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      rrect(F.x, F.y, F.w, F.h, 46 * S);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.lineWidth = 1 * S;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      rrect(F.x + 7 * S, F.y + 7 * S, F.w - 14 * S, F.h - 14 * S, 39 * S);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Tags Tabs
    const tags = parsedData.tags;
    const pt = easeOutCubic(seg(t, 0.15, 0.85));
    if (pt > 0 && tags.length > 0) {
      const activeIdx = Math.floor((tags.length - 1) / 2);
      const gap = 36 * S;
      const padX = 20 * S;
      ctx.save();
      ctx.globalAlpha = pt;
      ctx.font = `italic ${28 * S}px "Instrument Serif", Georgia, serif`;
      const ws = tags.map((tg, i) => ctx.measureText(tg).width + (i === activeIdx ? padX * 2 : 0));
      const totalW = ws.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
      const cy = Y(0.078) + (1 - pt) * 10 * S;
      let curX = F.cx - totalW / 2;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      tags.forEach((tg, i) => {
        const itemW = ws[i];
        if (i === activeIdx) {
          const ph = 48 * S;
          rrect(curX, cy - ph / 2, itemW, ph, ph / 2);
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.fill();
          ctx.lineWidth = 1.5 * S;
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.stroke();
        }
        ctx.fillStyle = i === activeIdx ? "#ffffff" : "rgba(255,255,255,0.85)";
        ctx.fillText(tg, curX + itemW / 2, cy);
        curX += itemW + gap;
      });
      ctx.restore();
    }

    // 4. Main Title & Script
    const titleClean = parsedData.title || "Nature's whisper";
    const words = titleClean.split(/\s+/);
    let scriptWord = "";
    let mainWords = titleClean.toUpperCase();
    if (scriptFirstWord && words.length >= 2) {
      scriptWord = words[0][0].toUpperCase() + words[0].slice(1).toLowerCase();
      mainWords = words.slice(1).join(" ").toUpperCase();
    }

    const SQ = 0.58;
    const baseFs = 150 * S;
    const pTitle = easeOutCubic(seg(t, 0.55, 1.3));
    if (pTitle > 0) {
      ctx.save();
      ctx.globalAlpha = pTitle;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 10 * S;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `${baseFs}px "Bebas Neue", Impact, sans-serif`;

      const titleY = Y(0.34) + (1 - pTitle) * 20 * S;
      ctx.save();
      ctx.translate(F.cx, titleY);
      ctx.scale(SQ, 1);
      ctx.fillText(mainWords, 0, 0);
      ctx.restore();

      // Script cursive word
      if (scriptWord) {
        const qScript = seg(t, 0.95, 1.75);
        if (qScript > 0) {
          ctx.save();
          ctx.font = `${85 * S}px "Pinyon Script", cursive`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.globalAlpha = clamp(qScript * 2);
          ctx.fillText(scriptWord, F.cx - 60 * S, titleY - 60 * S);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // 5. Author Subtitle
    const pSub = easeOutCubic(seg(t, 1.5, 2.1));
    if (pSub > 0) {
      ctx.save();
      ctx.globalAlpha = pSub;
      const subY = Y(0.39) + (1 - pSub) * -8 * S;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${18 * S}px Poppins, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(`storytelling by ${author}`, F.cx, subY);
      ctx.restore();
    }

    // 6. Search Bar with Typewriter Effect
    const pSearch = easeOutCubic(seg(t, 1.9, 2.5));
    if (pSearch > 0) {
      const searchW = F.w * 0.72;
      const searchH = 48 * S;
      const searchY = Y(0.48);
      ctx.save();
      ctx.globalAlpha = pSearch;
      rrect(F.cx - searchW / 2, searchY - searchH / 2, searchW, searchH, searchH / 2);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fill();
      ctx.lineWidth = 1.5 * S;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.stroke();

      // Search Icon
      const iconX = F.cx - searchW / 2 + 28 * S;
      ctx.lineWidth = 2 * S;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(iconX, searchY - 1 * S, 6 * S, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(iconX + 4.5 * S, searchY + 3.5 * S);
      ctx.lineTo(iconX + 10 * S, searchY + 9 * S);
      ctx.stroke();

      // Typing Text
      const queryStr = titleClean.toLowerCase();
      const kType = seg(t, 2.5, 4.0);
      const typedLen = Math.floor(kType * queryStr.length);
      const typedStr = queryStr.slice(0, typedLen);

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${18 * S}px Poppins, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(typedStr, iconX + 22 * S, searchY);

      // Blinking Cursor
      if (t >= 2.5 && t < 5.0 && Math.floor(t * 3) % 2 === 0) {
        const textW = ctx.measureText(typedStr).width;
        ctx.fillRect(iconX + 24 * S + textW, searchY - 10 * S, 2 * S, 20 * S);
      }
      ctx.restore();
    }

    // 7. Floating Photo Cards
    const cardSpecs = [
      { dx: -0.28, dy: 0.58, w: 0.22, r: -7 },
      { dx: 0.28, dy: 0.58, w: 0.22, r: 6 },
      { dx: -0.16, dy: 0.65, w: 0.26, r: -4 },
      { dx: 0.16, dy: 0.65, w: 0.26, r: 4 },
      { dx: 0, dy: 0.71, w: 0.32, r: 0 },
    ];
    cardSpecs.forEach((c, idx) => {
      const a = 4.0 + idx * 0.12;
      const pc = seg(t, a, a + 0.55);
      if (pc <= 0) return;
      const cardW = F.w * c.w;
      const cardH = cardW * 0.94;
      const tx = F.cx + F.w * c.dx;
      const ty = Y(c.dy);
      const cx = lerp(F.cx, tx, easeOutCubic(pc));
      const cy = lerp(Y(0.48), ty, easeOutCubic(pc));
      const scale = lerp(0.2, 1, easeOutBack(pc));

      ctx.save();
      ctx.globalAlpha = clamp(pc * 3);
      ctx.translate(cx, cy);
      ctx.rotate(((c.r * Math.PI) / 180) * easeOutCubic(pc));
      ctx.scale(scale, scale);

      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 12 * S;
      rrect(-cardW / 2, -cardH / 2, cardW, cardH, 8 * S);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Card Inner Image Mock / Frame
      ctx.shadowBlur = 0;
      rrect(-cardW / 2 + 3 * S, -cardH / 2 + 3 * S, cardW - 6 * S, cardH - 6 * S, 6 * S);
      ctx.fillStyle = ["#1a4332", "#3a2118", "#2d3748", "#1e3a8a", "#0f172a"][idx];
      ctx.fill();
      ctx.restore();
    });

    // 8. Music Pill at Bottom
    const pMusic = seg(t, 4.8, 5.5);
    if (pMusic > 0) {
      const eMusic = easeOutCubic(pMusic);
      const musicW = F.w * 0.78;
      const musicH = 68 * S;
      const musicY = Y(0.88) + (1 - eMusic) * 40 * S;
      ctx.save();
      ctx.globalAlpha = eMusic;
      rrect(F.cx - musicW / 2, musicY - musicH / 2, musicW, musicH, musicH / 2);
      ctx.fillStyle = "rgba(12,18,32,0.65)";
      ctx.fill();
      ctx.lineWidth = 1.5 * S;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.stroke();

      // Album art disc
      const artSize = 44 * S;
      const artX = F.cx - musicW / 2 + 16 * S;
      rrect(artX, musicY - artSize / 2, artSize, artSize, 8 * S);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5 * S;
      ctx.stroke();

      // Music Icon inside art
      ctx.fillStyle = "#ffffff";
      ctx.font = `${14 * S}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♫", artX + artSize / 2, musicY);

      // Track Title
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${18 * S}px Poppins, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(author, artX + artSize + 12 * S, musicY - 8 * S);
      ctx.font = `400 ${14 * S}px Poppins, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText("suara asli", artX + artSize + 12 * S, musicY + 12 * S);
      ctx.restore();
    }
  }, [previewTime, parsedData, author, scriptFirstWord]);

  // Video preview player time sync
  const handleVideoTimeUpdate = () => {
    if (videoPreviewRef.current) {
      setPreviewTime(videoPreviewRef.current.currentTime);
    }
  };

  const togglePreviewPlay = () => {
    if (!videoPreviewRef.current) return;
    if (isPlayingPreview) {
      videoPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      videoPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Main Render Action
  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderError(null);
    setRenderedResult(null);
    setRenderProgress(10);
    setRenderStep("Mempersiapkan font tipografi & frame...");

    try {
      let res;
      if (videoSourceType === "upload" && uploadedFile) {
        setRenderStep("Mengunggah video MP4 Anda...");
        setRenderProgress(25);
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("rawText", rawText);
        formData.append("author", author);
        formData.append("width", String(width));
        formData.append("duration", String(duration));
        formData.append("scriptFirstWord", String(scriptFirstWord));

        res = await axios.post("/api/story-edit", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
          onUploadProgress: (progressEvent) => {
            const pct = Math.round((progressEvent.loaded * 40) / (progressEvent.total || 1));
            setRenderProgress(20 + pct);
          },
        });
      } else {
        setRenderStep("Mengekstrak frame & menganalisis video...");
        setRenderProgress(35);
        const targetUrl =
          videoSourceType === "url" && customVideoUrl.trim()
            ? customVideoUrl.trim()
            : selectedPresetVideo;

        res = await axios.post(
          "/api/story-edit",
          {
            url: targetUrl,
            rawText,
            author,
            width,
            duration,
            scriptFirstWord,
          },
          { timeout: 120000 }
        );
      }

      setRenderProgress(80);
      setRenderStep("Menggabungkan animasi tipografi ke video MP4...");

      if (res.data && res.data.ok) {
        setRenderProgress(100);
        setRenderStep("Selesai!");
        setRenderedResult(res.data);
      } else {
        throw new Error(res.data?.message || "Gagal merender video.");
      }
    } catch (err: any) {
      console.error("Render error:", err);
      setRenderError(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal memproses render video Story Edit. Pastikan format video MP4 valid."
      );
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Type className="w-4 h-4" />
          <span>RS Canvas • Story Edit Typography</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight flex items-center gap-2">
          <span>Video Story Typography Generator</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            MP4 9:16
          </span>
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Render animasi tipografi aesthetic langsung di atas video mentahan MP4. Dilengkapi bingkai neon, teks latin bersambung, search bar mengetik, 5 foto melayang, dan pemutar musik.
        </p>
      </div>

      {/* Preset Banner Highlight (Requested by User) */}
      <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format Teks Tipografi Rekomendasi:</span>
          </div>
          <code className="text-xs sm:text-sm font-semibold text-black dark:text-white bg-white/60 dark:bg-black/40 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/10 inline-block font-mono">
            Nature&apos;s whisper | Healing, Serenity, Escapism
          </code>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => handleCopyText("Nature's whisper | Healing, Serenity, Escapism")}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-white dark:bg-[#2c2c2e] hover:bg-slate-100 dark:hover:bg-[#3a3a3c] text-xs font-semibold rounded-xl text-black dark:text-white border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
            title="Salin teks ke clipboard"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset(PRESET_LIST[0])}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gunakan Teks Ini</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Upload */}
        <div className="lg:col-span-7 space-y-5">
          {/* Typography Input Card */}
          <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-[#007aff]" />
                <span>Teks Tipografi & Tag (Story Edit)</span>
              </label>
              <button
                type="button"
                onClick={() => handleCopyText(rawText)}
                className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1 cursor-pointer"
              >
                {copiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText ? "Tersalin" : "Salin Teks"}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contoh: Nature's whisper | Healing, Serenity, Escapism"
                className="w-full px-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-black dark:text-white font-medium placeholder-[#8e8e93] focus:outline-hidden focus:ring-2 focus:ring-[#007aff]/50 transition"
              />
            </div>

            {/* Parsed Structure Preview */}
            <div className="p-3 bg-slate-50 dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8e8e93] dark:text-[#98989d] text-[11px] font-semibold uppercase">
                  Judul Utama:
                </span>
                <span className="font-bold text-black dark:text-white">
                  {parsedData.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8e8e93] dark:text-[#98989d] text-[11px] font-semibold uppercase">
                  Tags Terdeteksi:
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {parsedData.tags.map((tg, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff] text-[10px] font-bold rounded-md"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#8e8e93] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Pilihan Preset Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LIST.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      rawText === p.rawText
                        ? "bg-[#007aff] text-white shadow-xs"
                        : "bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-black dark:text-white border border-black/5 dark:border-white/5"
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Video Source Picker Card */}
          <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
            <label className="text-xs sm:text-sm font-bold text-black dark:text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-500" />
              <span>Sumber Video Mentahan (MP4)</span>
            </label>

            {/* Tabs: Upload vs Preset vs URL */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setVideoSourceType("upload")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  videoSourceType === "upload"
                    ? "bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-xs"
                    : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload MP4</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoSourceType("preset")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  videoSourceType === "preset"
                    ? "bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-xs"
                    : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Video Contoh</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoSourceType("url")}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  videoSourceType === "url"
                    ? "bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-xs"
                    : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Tautan URL</span>
              </button>
            </div>

            {/* Video Input Body */}
            {videoSourceType === "upload" && (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-black/10 dark:border-white/15 hover:border-[#007aff]/60 dark:hover:border-[#0a84ff]/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 text-center group">
                  <input
                    type="file"
                    accept="video/mp4,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-black dark:text-white">
                      {uploadedFile ? uploadedFile.name : "Klik atau seret file video MP4 ke sini"}
                    </p>
                    <p className="text-[11px] text-[#8e8e93] dark:text-[#98989d] mt-0.5">
                      {uploadedFile
                        ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB • Siap diproses`
                        : "Mendukung MP4 vertikal 9:16 untuk hasil optimal (maks 150MB)"}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {videoSourceType === "preset" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPresetVideo("/samples/nature.mp4")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    selectedPresetVideo === "/samples/nature.mp4"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-black/5 dark:border-white/10 bg-[#f2f2f7] dark:bg-[#2c2c2e]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Emerald Nature Flow</span>
                    {selectedPresetVideo === "/samples/nature.mp4" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#8e8e93]">Video alam 8 detik 9:16</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPresetVideo("/samples/sunset.mp4")}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    selectedPresetVideo === "/samples/sunset.mp4"
                      ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border-black/5 dark:border-white/10 bg-[#f2f2f7] dark:bg-[#2c2c2e]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Warm Sunset Glow</span>
                    {selectedPresetVideo === "/samples/sunset.mp4" && (
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#8e8e93]">Video senja 8 detik 9:16</span>
                </button>
              </div>
            )}

            {videoSourceType === "url" && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={customVideoUrl}
                  onChange={(e) => setCustomVideoUrl(e.target.value)}
                  placeholder="https://.../video.mp4"
                  className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 rounded-2xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-hidden focus:ring-2 focus:ring-[#007aff]/50 transition"
                />
                <p className="text-[11px] text-[#8e8e93]">
                  Pastikan tautan dapat diakses publik langsung ke file video berekstensi .mp4.
                </p>
              </div>
            )}
          </div>

          {/* Advanced Customization Collapsible */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/5 dark:border-white/10 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 flex items-center justify-between text-xs sm:text-sm font-bold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#007aff]" />
                <span>Pengaturan Lanjutan (Author, Resolusi, Durasi)</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-5 pt-1 border-t border-black/5 dark:border-white/10 space-y-4 text-xs">
                {/* Author Input */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-black dark:text-white">
                    Nama Author (Storytelling by ...)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="nexadev"
                    className="w-full px-3.5 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 rounded-xl text-black dark:text-white"
                  />
                </div>

                {/* Resolution & Durasi */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-black dark:text-white">Resolusi Output</label>
                    <select
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 rounded-xl text-black dark:text-white"
                    >
                      <option value={540}>540x960 (Cepat ~3-5 detik)</option>
                      <option value={720}>720x1280 (HD 9:16 Story)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-black dark:text-white">Durasi Render</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/5 dark:border-white/10 rounded-xl text-black dark:text-white"
                    >
                      <option value={5}>5 Detik</option>
                      <option value={8}>8 Detik (Standar)</option>
                      <option value={10}>10 Detik</option>
                      <option value={15}>15 Detik (Maksimal)</option>
                    </select>
                  </div>
                </div>

                {/* Script Font First Word Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium text-black dark:text-white">
                    Gaya Huruf Pertama Latin (RS Script Cursive)
                  </span>
                  <input
                    type="checkbox"
                    checked={scriptFirstWord}
                    onChange={(e) => setScriptFirstWord(e.target.checked)}
                    className="w-4 h-4 accent-[#007aff] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Render Action Button */}
          <div>
            <button
              type="button"
              disabled={isRendering}
              onClick={handleStartRender}
              className="w-full py-3.5 bg-gradient-to-r from-[#007aff] via-[#0062cc] to-[#0051a8] hover:opacity-95 active:scale-98 text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{renderStep || "Sedang Merender Video MP4..."}</span>
                </>
              ) : (
                <>
                  <Film className="w-5 h-5" />
                  <span>Render Video Story MP4 Sekarang</span>
                </>
              )}
            </button>
            {isRendering && (
              <div className="mt-2.5 space-y-1">
                <div className="w-full h-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#007aff] transition-all duration-300 rounded-full"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#8e8e93]">
                  <span>{renderStep}</span>
                  <span>{renderProgress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Render Error */}
          {renderError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Memproses Render Video</p>
                <p className="text-xs mt-0.5 opacity-90">{renderError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Preview & Result */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Preview Card */}
          <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#007aff]" />
                <span>Pratinjau Langsung (9:16 Canvas)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="px-2.5 py-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] rounded-xl text-xs font-semibold flex items-center gap-1 text-black dark:text-white cursor-pointer transition"
                >
                  {isPlayingPreview ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingPreview ? "Jeda" : "Putar"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTime(0);
                    if (videoPreviewRef.current) {
                      videoPreviewRef.current.currentTime = 0;
                    }
                  }}
                  className="p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-black dark:text-white cursor-pointer"
                  title="Mulai dari awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 9:16 Preview Box */}
            <div className="relative mx-auto aspect-9/16 max-w-[280px] sm:max-w-[300px] w-full rounded-2xl overflow-hidden shadow-xl bg-black border border-black/10 dark:border-white/15">
              {/* Background Video */}
              <video
                ref={videoPreviewRef}
                src={currentVideoSrc}
                loop
                muted
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Timestamp badge */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white font-semibold">
                {previewTime.toFixed(1)}s / {duration}s
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-[#8e8e93]">
                <span>Timeline Animasi:</span>
                <span className="font-mono font-bold text-black dark:text-white">
                  {previewTime.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={previewTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPreviewTime(val);
                  if (videoPreviewRef.current) {
                    videoPreviewRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-[#007aff] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8e8e93]">
                <span>0.0s (Frame)</span>
                <span>1.5s (Title)</span>
                <span>2.5s (Type)</span>
                <span>4.0s (Cards)</span>
                <span>{duration}.0s</span>
              </div>
            </div>
          </div>

          {/* Render Result Card */}
          {renderedResult && (
            <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-3xl border border-emerald-500/30 shadow-md space-y-4 animate-ios-fade">
              <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs sm:text-sm font-bold text-black dark:text-white">
                    Video Story Selesai Dirender!
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                  {renderedResult.duration} Detik MP4
                </span>
              </div>

              {/* Rendered Video Player */}
              <div className="aspect-9/16 max-w-[240px] mx-auto rounded-2xl overflow-hidden shadow-lg border border-black/10 dark:border-white/10 bg-black">
                <video
                  src={renderedResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={renderedResult.videoUrl}
                  download={renderedResult.filename}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Video MP4</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyResultUrl(renderedResult.videoUrl)}
                  className="w-full py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-black dark:text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                >
                  {copiedResultUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tautan Video Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Tautan Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
