import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  AlertCircle,
  Loader2,
  Film,
  Zap,
  Server,
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

/**
 * Universal Typography Composite Renderer
 * Renders backdrop, frame border, pill tags, Bebas title, cursive script,
 * author subtitle, search bar with typewriter, 5 floating cards, and music player.
 */
function renderTypographyFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  parsedData: { title: string; tags: string[] },
  author: string,
  scriptFirstWord: boolean,
  bgVideo?: HTMLVideoElement | null
) {
  const S = W / 720;
  const F = {
    x: 30 * S,
    y: 44 * S,
    w: W - 60 * S,
    h: H - 88 * S,
    cx: W / 2,
  };
  const Y = (k: number) => F.y + F.h * k;

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

  // 0. Background Video Frame (when rendering offscreen composite)
  if (bgVideo && bgVideo.readyState >= 2) {
    try {
      const vw = bgVideo.videoWidth || W;
      const vh = bgVideo.videoHeight || H;
      const scale = Math.max(W / vw, H / vh);
      const sw = W / scale;
      const sh = H / scale;
      const sx = (vw - sw) / 2;
      const sy = (vh - sh) / 2;
      ctx.drawImage(bgVideo, sx, sy, sw, sh, 0, 0, W, H);
    } catch {}
  }

  // 1. Subtle dark vignette overlay
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,10,32,0.45)");
  g.addColorStop(0.5, "rgba(0,10,32,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 2. Aesthetic Frame Border
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
    ctx.fillStyle = "rgba(120,160,230,0.06)";
    ctx.fill();

    ctx.shadowColor = "rgba(190,220,255,0.6)";
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

  // 3. Category Tags Tabs
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

    const queryStr = titleClean.toLowerCase();
    const kType = seg(t, 2.5, 4.0);
    const typedLen = Math.floor(kType * queryStr.length);
    const typedStr = queryStr.slice(0, typedLen);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${18 * S}px Poppins, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(typedStr, iconX + 22 * S, searchY);
    ctx.restore();
  }

  // 7. Mini 5 Floating Cards
  const spec = [
    { dx: -0.3, dy: 0.625, w: 0.2, r: -7 },
    { dx: 0.3, dy: 0.622, w: 0.2, r: 6 },
    { dx: -0.17, dy: 0.683, w: 0.255, r: -4 },
    { dx: 0.17, dy: 0.683, w: 0.255, r: 4 },
    { dx: 0, dy: 0.728, w: 0.3, r: 0 },
  ];
  spec.forEach((c, i) => {
    const a = 3.6 + i * 0.12;
    const pc = seg(t, a, a + 0.55);
    if (pc <= 0) return;
    const e = easeOutCubic(pc);
    const cw = F.w * c.w;
    const ch = cw * 0.94;
    const tx = F.cx + F.w * c.dx;
    const ty = Y(c.dy) + (i === 4 ? Math.sin(t * 1.8) * 3 * S : 0);
    const cxPos = lerp(F.cx, tx, e);
    const cyPos = lerp(Y(0.538), ty, e);
    const sc = lerp(0.25, 1, easeOutBack(pc));

    ctx.save();
    ctx.globalAlpha = clamp(pc * 3);
    ctx.translate(cxPos, cyPos);
    ctx.rotate(((c.r * Math.PI) / 180) * e);
    ctx.scale(sc, sc);
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 14 * S;
    rrect(-cw / 2, -ch / 2, cw, ch, 8 * S);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();

    const bd = 3 * S;
    rrect(-cw / 2 + bd, -ch / 2 + bd, cw - bd * 2, ch - bd * 2, 6 * S);
    ctx.fillStyle = `hsl(${160 + i * 28}, 45%, 38%)`;
    ctx.fill();
    ctx.restore();
  });

  // 8. Music Bar at bottom
  const pMus = seg(t, 4.4, 5.0);
  if (pMus > 0) {
    const eMus = easeOutCubic(pMus);
    const mw = F.w * 0.77;
    const mh = 70 * S;
    const my = Y(0.885) + (1 - eMus) * 40 * S;
    const mx = F.cx - mw / 2;

    ctx.save();
    ctx.globalAlpha = eMus;
    rrect(mx, my - mh / 2, mw, mh, mh / 2);
    ctx.fillStyle = "rgba(12,18,32,0.60)";
    ctx.fill();
    ctx.lineWidth = 1.5 * S;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.stroke();

    // Album art disc
    const aw = 46 * S;
    const ax = mx + 16 * S;
    ctx.beginPath();
    ctx.arc(ax + aw / 2, my, aw / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.lineWidth = 1 * S;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Track text
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${16 * S}px Poppins, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(author, ax + aw + 14 * S, my - 8 * S);

    ctx.font = `${12 * S}px Poppins, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("suara asli", ax + aw + 14 * S, my + 10 * S);
    ctx.restore();
  }
}

export const StoryEditTool: React.FC = () => {
  // Main typography text input
  const [rawText, setRawText] = useState("Nature's whisper | Healing, Serenity, Escapism");
  const [author, setAuthor] = useState("nexadev");

  // Video source state: direct file upload is primary
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [selectedSampleVideo, setSelectedSampleVideo] = useState<string>("/samples/nature.mp4");
  const [useSampleMode, setUseSampleMode] = useState<boolean>(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  // Render Engine Mode: default is browser for zero server burden & zero "Failed to fetch"
  const [renderEngine, setRenderEngine] = useState<"browser" | "server">("browser");

  // Customization options
  const [width, setWidth] = useState<number>(540); // 540x960 fast or 720x1280 HD
  const [duration, setDuration] = useState<number>(8);
  const [scriptFirstWord, setScriptFirstWord] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewTime, setPreviewTime] = useState<number>(3.5);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Parsed metadata from rawText
  const parsedData = useMemo(() => {
    return parseCommand(rawText);
  }, [rawText]);

  // Current effective video URL for preview
  const currentVideoSrc = useMemo(() => {
    if (!useSampleMode && uploadedVideoUrl) {
      return uploadedVideoUrl;
    }
    if (showUrlInput && customVideoUrl.trim()) {
      return customVideoUrl.trim();
    }
    return selectedSampleVideo;
  }, [useSampleMode, uploadedVideoUrl, showUrlInput, customVideoUrl, selectedSampleVideo]);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (uploadedVideoUrl && uploadedVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);

  // Handle direct file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
        setRenderError("Pilih file video MP4 yang valid.");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        setRenderError("Ukuran file video terlalu besar (maksimal 200MB).");
        return;
      }
      setUploadedFile(file);
      const objUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(objUrl);
      setUseSampleMode(false);
      setRenderError(null);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
        setRenderError("Pilih file video MP4 yang valid.");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        setRenderError("Ukuran file video terlalu besar (maksimal 200MB).");
        return;
      }
      setUploadedFile(file);
      const objUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(objUrl);
      setUseSampleMode(false);
      setRenderError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Copy raw typography text
  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {}
  };

  // Copy result URL
  const handleCopyResultUrl = async (url: string) => {
    try {
      const fullUrl = url.startsWith("blob:") ? "Video dimuat langsung di browser Anda" : window.location.origin + url;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedResultUrl(true);
      setTimeout(() => setCopiedResultUrl(false), 2000);
    } catch {}
  };

  // Apply preset
  const handleSelectPreset = (p: PresetItem) => {
    setRawText(p.rawText);
    setAuthor(p.author);
    if (useSampleMode || !uploadedFile) {
      setSelectedSampleVideo(p.sampleVideo);
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

    // Render preview overlays (video sits beneath canvas element in DOM)
    renderTypographyFrame(ctx, W, H, previewTime, parsedData, author, scriptFirstWord, null);
  }, [previewTime, parsedData, author, scriptFirstWord]);

  // Video timeupdate sync
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

  /**
   * Browser Direct Render Engine (Zero Server Load & Anti "Failed to fetch")
   * Directly composites video + typography in browser memory using HTML5 Canvas & MediaRecorder.
   * Does NOT upload file to server and does NOT write anything to server disk.
   */
  const executeBrowserRender = useCallback(async (): Promise<{
    videoUrl: string;
    filename: string;
    duration: number;
  }> => {
    setRenderStep("Menyiapkan Canvas & Perekam Video Browser...");
    setRenderProgress(10);

    // Wait for web fonts to load
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch {}

    const W = width;
    const H = Math.round(((width * 16) / 9) / 2) * 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) throw new Error("Gagal menginisialisasi Canvas di browser.");

    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.src = currentVideoSrc;
    vid.muted = true; // Avoid feedback while recording
    vid.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout memuat video di browser.")), 20000);
      vid.onloadeddata = () => {
        clearTimeout(timer);
        resolve();
      };
      vid.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Gagal membaca file video sumber. Pastikan format MP4 dapat diputar."));
      };
      vid.load();
    });

    const fps = 30;
    const canvasStream = (offscreen as any).captureStream
      ? (offscreen as any).captureStream(fps)
      : (offscreen as any).mozCaptureStream
      ? (offscreen as any).mozCaptureStream(fps)
      : null;

    if (!canvasStream) {
      throw new Error("Browser Anda tidak mendukung perekaman Canvas Stream. Silakan gunakan Chrome, Edge, Safari, atau Firefox terbaru.");
    }

    // Capture audio from video if available
    try {
      const vidStream = (vid as any).captureStream ? (vid as any).captureStream() : (vid as any).mozCaptureStream ? (vid as any).mozCaptureStream() : null;
      if (vidStream) {
        const audioTracks = vidStream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      }
    } catch (e) {
      console.warn("Audio capture bypassed:", e);
    }

    // Determine optimal supported MIME type
    let mimeType = "video/webm";
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        mimeType = c;
        break;
      }
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 3500000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const ext = mimeType.includes("mp4") ? "mp4" : "mp4"; // named mp4 for easy saving
    const safeTitle = (parsedData.title || "story").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
    const outFilename = `storyedit_${safeTitle}_${Date.now()}.${ext}`;

    return new Promise<{ videoUrl: string; filename: string; duration: number }>((resolve, reject) => {
      let animId: number;
      let isDone = false;

      recorder.onstop = () => {
        vid.pause();
        cancelAnimationFrame(animId);
        const finalBlob = new Blob(chunks, { type: mimeType });
        const objUrl = URL.createObjectURL(finalBlob);
        resolve({
          videoUrl: objUrl,
          filename: outFilename,
          duration,
        });
      };

      recorder.onerror = (e: any) => {
        vid.pause();
        cancelAnimationFrame(animId);
        reject(new Error(e?.error?.message || "Gagal merekam video di browser."));
      };

      recorder.start(200);
      vid.currentTime = 0;

      vid.play().then(() => {
        const startTime = performance.now();
        const targetDurationMs = duration * 1000;

        const loop = () => {
          if (isDone) return;
          const elapsed = performance.now() - startTime;
          const curSec = Math.min(duration, elapsed / 1000);
          const pct = Math.min(98, Math.round((curSec / duration) * 100));

          setRenderProgress(pct);
          setRenderStep(`Merender frame tipografi & video (${pct}%)...`);

          renderTypographyFrame(
            offCtx,
            W,
            H,
            curSec,
            parsedData,
            author,
            scriptFirstWord,
            vid
          );

          if (elapsed >= targetDurationMs || vid.ended) {
            isDone = true;
            setRenderProgress(100);
            setRenderStep("Menyelesaikan berkas video...");
            recorder.stop();
          } else {
            animId = requestAnimationFrame(loop);
          }
        };

        animId = requestAnimationFrame(loop);
      }).catch((err) => {
        reject(new Error("Gagal memulai pemutaran video: " + err.message));
      });
    });
  }, [width, currentVideoSrc, duration, parsedData, author, scriptFirstWord]);

  /**
   * Server Render Engine (FFmpeg Ultra Speed via rawvideo)
   */
  const executeServerRender = async (): Promise<{
    videoUrl: string;
    filename: string;
    duration: number;
  }> => {
    let finalVideoUrl = "";
    let finalFilename = `storyedit_${Date.now()}.mp4`;
    let finalDuration = duration;

    if (!useSampleMode && uploadedFile) {
      setRenderStep("Mengunggah data video ke server...");
      setRenderProgress(20);

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("rawText", rawText);
      formData.append("author", author);
      formData.append("width", String(width));
      formData.append("duration", String(duration));
      formData.append("scriptFirstWord", String(scriptFirstWord));

      const res = await axios.post("/api/story-edit", formData, {
        responseType: "blob",
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadPct = Math.round((progressEvent.loaded * 45) / progressEvent.total);
            setRenderProgress(15 + uploadPct);
            if (uploadPct >= 42) {
              setRenderStep("Merender video & tipografi dengan FFmpeg...");
            }
          }
        },
      });

      if (res.data instanceof Blob) {
        finalVideoUrl = URL.createObjectURL(res.data);
        finalFilename = (res.headers["x-video-filename"] as string) || finalFilename;
        finalDuration = Number(res.headers["x-video-duration"]) || duration;
      }
    } else {
      setRenderStep("Memproses render video di server...");
      setRenderProgress(35);
      const targetUrl = showUrlInput && customVideoUrl.trim()
        ? customVideoUrl.trim()
        : selectedSampleVideo;

      const res = await axios.post(
        "/api/story-edit",
        {
          url: targetUrl,
          rawText,
          author,
          width,
          duration,
          scriptFirstWord,
        },
        {
          responseType: "blob",
          timeout: 300000,
        }
      );

      if (res.data instanceof Blob) {
        finalVideoUrl = URL.createObjectURL(res.data);
        finalFilename = (res.headers["x-video-filename"] as string) || finalFilename;
        finalDuration = Number(res.headers["x-video-duration"]) || duration;
      }
    }

    return {
      videoUrl: finalVideoUrl,
      filename: finalFilename,
      duration: finalDuration,
    };
  };

  /**
   * Main Render Handler
   * Direct execution with automated fallback to ensure the user ALWAYS gets a completed video.
   */
  const handleStartRender = async () => {
    // Revoke previous blob if exists
    if (renderedResult?.videoUrl && renderedResult.videoUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(renderedResult.videoUrl);
      } catch {}
    }

    setIsRendering(true);
    setRenderError(null);
    setRenderedResult(null);
    setRenderProgress(10);

    try {
      let resultData: { videoUrl: string; filename: string; duration: number };

      if (renderEngine === "browser") {
        // Direct browser rendering: 0 server load, no storage, instant display
        resultData = await executeBrowserRender();
      } else {
        // Server FFmpeg render with auto-fallback to browser if server is unreachable
        try {
          resultData = await executeServerRender();
        } catch (serverErr: any) {
          console.warn("Server render encountered error, auto-fallback to Browser Engine:", serverErr);
          setRenderStep("Koneksi server bermasalah, beralih otomatis ke Browser Engine...");
          setRenderProgress(15);
          // Seamless fallback
          resultData = await executeBrowserRender();
        }
      }

      setRenderProgress(100);
      setRenderStep("Selesai! Video langsung ditampilkan.");
      setRenderedResult({
        videoUrl: resultData.videoUrl,
        filename: resultData.filename,
        title: parsedData.title || "Nature's whisper",
        tags: parsedData.tags,
        author,
        duration: resultData.duration,
      });
    } catch (err: any) {
      console.error("Render execution error:", err);
      let errMsg = "Gagal memproses render video Story Edit.";
      if (err?.message === "Network Error" || err?.message?.includes("fetch")) {
        errMsg = "Koneksi terputus. Silakan gunakan Mode Render Browser untuk hasil instan tanpa membebani server.";
      } else if (err?.message) {
        errMsg = err.message;
      }
      setRenderError(errMsg);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
          <span>Story Edit Typography</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
            MP4 9:16
          </span>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">
          Render animasi tipografi aesthetic langsung di atas video MP4. Hasil langsung ditampilkan tanpa menumpuk di server.
        </p>
      </div>

      {/* Main Grid: Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Direct Upload */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Video Source (Direct File Upload is Primary) */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                1. Sumber Video MP4
              </span>
              <span className="text-[11px] text-neutral-500 font-medium">Format 9:16 Story</span>
            </div>

            {/* Direct Upload Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                uploadedFile && !useSampleMode
                  ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/40"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {uploadedFile && !useSampleMode
                    ? uploadedFile.name
                    : "Pilih atau Seret Video MP4 ke Sini"}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {uploadedFile && !useSampleMode
                    ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB • Siap dirender`
                    : "Langsung dari galeri / komputer Anda (tanpa perlu URL eksternal)"}
                </p>
              </div>
              {uploadedFile && !useSampleMode && (
                <span className="text-[11px] px-2.5 py-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg font-medium">
                  Ganti Video
                </span>
              )}
            </div>

            {/* Alternative: Use Sample Videos */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Atau gunakan video sampel bawaan:</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:underline cursor-pointer"
                >
                  {showUrlInput ? "Tutup URL" : "Pakai URL Video"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSampleVideo("/samples/nature.mp4");
                    setUseSampleMode(true);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition text-xs font-medium cursor-pointer ${
                    useSampleMode && selectedSampleVideo === "/samples/nature.mp4"
                      ? "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <p className="font-semibold truncate">Emerald Nature</p>
                  <p className="text-[10px] text-neutral-500">Video Alam Aesthetic</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSampleVideo("/samples/sunset.mp4");
                    setUseSampleMode(true);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition text-xs font-medium cursor-pointer ${
                    useSampleMode && selectedSampleVideo === "/samples/sunset.mp4"
                      ? "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <p className="font-semibold truncate">Warm Sunset</p>
                  <p className="text-[10px] text-neutral-500">Video Senja Pantai</p>
                </button>
              </div>

              {showUrlInput && (
                <div className="pt-2">
                  <input
                    type="url"
                    value={customVideoUrl}
                    onChange={(e) => {
                      setCustomVideoUrl(e.target.value);
                      setUseSampleMode(true);
                    }}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Typography & Caption Input */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                2. Teks & Kategori Story
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(rawText)}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Text Input with Format */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Judul Cerita | Tag 1, Tag 2, Tag 3"
                className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Gunakan format tanda pipa <code>|</code> untuk memisahkan Judul dan Tags.
              </p>
            </div>

            {/* Parsed Structure Preview */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-semibold">
                  Judul:
                </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {parsedData.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-semibold">
                  Tags:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {parsedData.tags.map((tg, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-medium rounded-md"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Preset Options */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-neutral-500 font-medium">Contoh Teks Siap Pakai:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LIST.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      rawText === p.rawText
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Render Engine Mode & Settings */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                3. Mesin Render & Pengaturan
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                0 Beban Disk Server
              </span>
            </div>

            {/* Engine Selection Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Pilih Mesin Pemroses Video:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRenderEngine("browser")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    renderEngine === "browser"
                      ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/80"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      Browser Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    Render langsung di HP/laptop Anda. Tanpa unggah data, bebas lag server & anti-gagal.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRenderEngine("server")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    renderEngine === "server"
                      ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/80"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      Server FFmpeg
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    Backend FFmpeg MP4. Otomatis beralih ke browser jika koneksi terputus.
                  </p>
                </button>
              </div>
            </div>

            {/* Settings Collapsible Button */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full pt-2 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer"
            >
              <span>Pengaturan Tambahan (Author, Resolusi, Durasi)</span>
              <span className="text-neutral-400 text-xs">{showSettings ? "Tutup" : "Buka"}</span>
            </button>

            {showSettings && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3.5 text-xs">
                {/* Author Input */}
                <div className="space-y-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300">
                    Nama Author (storytelling by...)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="nexadev"
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Resolution & Durasi */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300">Resolusi</label>
                    <select
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <option value={540}>540x960 (Cepat ~3-5 detik)</option>
                      <option value={720}>720x1280 (HD Story)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300">Durasi Video</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <option value={6}>6 Detik</option>
                      <option value={8}>8 Detik (Standar)</option>
                      <option value={10}>10 Detik</option>
                    </select>
                  </div>
                </div>

                {/* Script Word toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Kata Pertama Tulisan Sambung Cursive (RS Script)
                  </span>
                  <input
                    type="checkbox"
                    checked={scriptFirstWord}
                    onChange={(e) => setScriptFirstWord(e.target.checked)}
                    className="rounded accent-neutral-900 dark:accent-neutral-100 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Render Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStartRender}
              disabled={isRendering}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                isRendering
                  ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              }`}
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Merender Video ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Render Video Story Sekarang</span>
                </>
              )}
            </button>

            {isRendering && (
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-300 rounded-full"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>{renderStep}</span>
                  <span>{renderProgress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Render Error Alert */}
          {renderError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Informasi Render</p>
                <p className="text-xs mt-0.5 opacity-90">{renderError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Preview & Result */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Preview Card */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Pratinjau Animasi (9:16)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1 text-neutral-800 dark:text-neutral-200 cursor-pointer transition"
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
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  title="Mulai dari awal"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 9:16 Preview Frame */}
            <div className="relative mx-auto aspect-9/16 max-w-[270px] w-full rounded-xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <video
                ref={videoPreviewRef}
                src={currentVideoSrc}
                loop
                muted
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                {previewTime.toFixed(1)}s / {duration}s
              </div>
            </div>

            {/* Timeline Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Timeline Animasi:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
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
                className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Render Result Card */}
          {renderedResult && (
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Video Story Siap Ditampilkan
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {renderedResult.duration} Detik • Selesai
                </span>
              </div>

              {/* Rendered Video Player - Displayed Immediately */}
              <div className="aspect-9/16 max-w-[240px] mx-auto rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black">
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
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Video MP4</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyResultUrl(renderedResult.videoUrl)}
                  className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                >
                  {copiedResultUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Info Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Info Video</span>
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
