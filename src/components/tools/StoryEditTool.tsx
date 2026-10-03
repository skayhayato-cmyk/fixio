import React, { useState, useRef, useEffect, useMemo } from "react";
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

  // Video source state: direct file upload is primary
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [selectedSampleVideo, setSelectedSampleVideo] = useState<string>("/samples/nature.mp4");
  const [useSampleMode, setUseSampleMode] = useState<boolean>(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

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
      if (file.size > 150 * 1024 * 1024) {
        setRenderError("Ukuran file video terlalu besar (maksimal 150MB).");
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
      if (file.size > 150 * 1024 * 1024) {
        setRenderError("Ukuran file video terlalu besar (maksimal 150MB).");
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

    // 1. Subtle dark vignette
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(0,10,32,0.45)");
    g.addColorStop(0.5, "rgba(0,10,32,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
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

      // Card inner artwork placeholder
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

  // Main Render Action: Direct File Upload to /api/story-edit (Zero Disk Storage on Server)
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
    setRenderStep("Menyiapkan font tipografi...");

    try {
      let finalVideoUrl = "";
      let finalFilename = `storyedit_${Date.now()}.mp4`;
      let finalDuration = duration;

      // Direct File Upload Logic (no external url needed!)
      if (!useSampleMode && uploadedFile) {
        setRenderStep("Mengunggah video MP4...");
        setRenderProgress(20);

        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("rawText", rawText);
        formData.append("author", author);
        formData.append("width", String(width));
        formData.append("duration", String(duration));
        formData.append("scriptFirstWord", String(scriptFirstWord));

        try {
          // Primary: Axios with responseType: "blob" & upload progress tracking
          const res = await axios.post("/api/story-edit", formData, {
            responseType: "blob",
            timeout: 300000, // 5 minutes timeout
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const uploadPct = Math.round((progressEvent.loaded * 45) / progressEvent.total);
                setRenderProgress(15 + uploadPct);
                if (uploadPct >= 42) {
                  setRenderStep("Merender video & animasi tipografi dengan FFmpeg...");
                }
              }
            },
          });

          if (res.data instanceof Blob) {
            finalVideoUrl = URL.createObjectURL(res.data);
            finalFilename = (res.headers["x-video-filename"] as string) || finalFilename;
            finalDuration = Number(res.headers["x-video-duration"]) || duration;
          } else if (res.data?.videoUrl) {
            finalVideoUrl = res.data.videoUrl;
            finalFilename = res.data.filename || finalFilename;
            finalDuration = res.data.duration || duration;
          }
        } catch (axiosErr: any) {
          // If axios error has a blob response body containing JSON error
          if (axiosErr?.response?.data instanceof Blob) {
            try {
              const errText = await axiosErr.response.data.text();
              const errJson = JSON.parse(errText);
              throw new Error(errJson.message || "Gagal merender video.");
            } catch (pErr: any) {
              if (pErr.message && !pErr.message.includes("JSON")) throw pErr;
            }
          }

          console.warn("Axios upload failed, trying native fetch:", axiosErr?.message);
          // Fallback: Native fetch
          setRenderStep("Menyelesaikan proses render di server...");
          const fetchRes = await fetch("/api/story-edit", {
            method: "POST",
            body: formData,
          });

          if (!fetchRes.ok) {
            const errText = await fetchRes.text();
            let msg = `Server merespons dengan status ${fetchRes.status}`;
            try {
              const errJson = JSON.parse(errText);
              msg = errJson.message || msg;
            } catch {}
            throw new Error(msg);
          }

          const blob = await fetchRes.blob();
          finalVideoUrl = URL.createObjectURL(blob);
          finalFilename = fetchRes.headers.get("x-video-filename") || finalFilename;
          finalDuration = Number(fetchRes.headers.get("x-video-duration")) || duration;
        }
      } else {
        // Sample Video or Direct URL mode
        setRenderStep("Memproses video...");
        setRenderProgress(35);
        const targetUrl = showUrlInput && customVideoUrl.trim()
          ? customVideoUrl.trim()
          : selectedSampleVideo;

        try {
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
          } else if (res.data?.videoUrl) {
            finalVideoUrl = res.data.videoUrl;
            finalFilename = res.data.filename || finalFilename;
            finalDuration = res.data.duration || duration;
          }
        } catch (axiosErr: any) {
          if (axiosErr?.response?.data instanceof Blob) {
            try {
              const errText = await axiosErr.response.data.text();
              const errJson = JSON.parse(errText);
              throw new Error(errJson.message || "Gagal merender video.");
            } catch (pErr: any) {
              if (pErr.message && !pErr.message.includes("JSON")) throw pErr;
            }
          }
          throw axiosErr;
        }
      }

      setRenderProgress(100);
      setRenderStep("Selesai!");
      setRenderedResult({
        videoUrl: finalVideoUrl,
        filename: finalFilename,
        title: parsedData.title || "Nature's whisper",
        tags: parsedData.tags,
        author,
        duration: finalDuration,
      });
    } catch (err: any) {
      console.error("Render error:", err);
      let errMsg = "Gagal memproses render video Story Edit.";
      if (err?.message === "Network Error") {
        errMsg = "Koneksi terputus saat mengunggah video. Pastikan file video MP4 tidak korup dan coba kembali.";
      } else if (err?.response?.data?.message) {
        errMsg = err.response.data.message;
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
          Render animasi tipografi aesthetic langsung di atas video MP4 tanpa perlu upload ke URL eksternal.
        </p>
      </div>

      {/* Main Grid: Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Direct Upload */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Direct MP4 Video Upload */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                1. Upload Video MP4 Anda
              </label>
              {uploadedFile && !useSampleMode && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
            </div>

            {/* Direct Upload Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                uploadedFile && !useSampleMode
                  ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50 dark:bg-neutral-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-xl bg-neutral-200/80 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {uploadedFile && !useSampleMode
                    ? uploadedFile.name
                    : "Pilih atau seret file video MP4 ke sini"}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {uploadedFile && !useSampleMode
                    ? "Klik untuk mengganti video"
                    : "File video diproses langsung di server tanpa perlu upload ke URL"}
                </p>
              </div>
            </div>

            {/* Sample Video Alternative */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-neutral-500 text-[11px]">Atau gunakan video sampel:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSampleVideo("/samples/nature.mp4");
                    setUseSampleMode(true);
                    setRenderError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    useSampleMode && selectedSampleVideo === "/samples/nature.mp4"
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                  }`}
                >
                  Sampel Alam (Nature)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSampleVideo("/samples/sunset.mp4");
                    setUseSampleMode(true);
                    setRenderError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    useSampleMode && selectedSampleVideo === "/samples/sunset.mp4"
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200/60 dark:hover:bg-neutral-700"
                  }`}
                >
                  Sampel Senja (Sunset)
                </button>
              </div>
            </div>

            {/* Secondary URL toggle if user has a remote link */}
            <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer"
              >
                {showUrlInput ? "Sembunyikan input URL" : "Punya URL video MP4 langsung?"}
              </button>
              {showUrlInput && (
                <div className="mt-2 space-y-1">
                  <input
                    type="url"
                    value={customVideoUrl}
                    onChange={(e) => {
                      setCustomVideoUrl(e.target.value);
                      setUseSampleMode(false);
                    }}
                    placeholder="https://.../video.mp4"
                    className="w-full px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Masukkan URL langsung yang mengarah ke file .mp4 publik.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Typography Text Input */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                2. Teks Tipografi & Tag
              </label>
              <button
                type="button"
                onClick={() => handleCopyText(rawText)}
                className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 cursor-pointer font-medium"
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
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Judul Cerita | Tag 1, Tag 2, Tag 3"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                />
              </div>
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

          {/* Section 3: Settings Collapsible */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full p-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition cursor-pointer"
            >
              <span>Pengaturan Tambahan (Author, Resolusi, Huruf Sambung)</span>
              <span className="text-neutral-400 text-xs">{showSettings ? "Tutup" : "Buka"}</span>
            </button>

            {showSettings && (
              <div className="p-4 pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-3.5 text-xs">
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
                  <span>Render Video Story MP4 Sekarang</span>
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
                <p className="font-semibold">Gagal Memproses Render Video</p>
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
                Pratinjau Animasi (9:16 Canvas)
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
                  Video Story Selesai Dirender
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {renderedResult.duration} Detik MP4
                </span>
              </div>

              {/* Rendered Video Player */}
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
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition"
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
                      <span className="text-emerald-500">Tautan Tersalin</span>
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
