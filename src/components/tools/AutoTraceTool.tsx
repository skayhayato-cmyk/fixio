import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  TraceOptions,
  TraceResult,
  TraceLayerInfo,
  loadAndScaleImage,
  runAutoTrace,
} from "../../services/tracerEngine";
import {
  AlightOptions,
  AlightResult,
  AlightLayerInfo,
  SvgToAlightConverter,
} from "../../services/alightXmlEngine";
import {
  Wand2,
  Image as ImageIcon,
  Palette,
  Ruler,
  Eraser,
  Spline,
  Shapes,
  Droplets,
  Layers,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Grid,
  Trash2,
  Loader2,
  FileCode,
  Clock,
  Film,
  FileText,
  Sliders,
  Shield,
  Square,
  CheckSquare,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const AutoTraceTool: React.FC = () => {
  // Input Mode: "raster" (Auto Trace) or "svg" (Direct SVG to Alight XML)
  const [inputMode, setInputMode] = useState<"raster" | "svg">("raster");

  // Source Files & Previews
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("vector");
  const [directSvgText, setDirectSvgText] = useState<string>("");

  // Trace Settings
  const [traceOpts, setTraceOpts] = useState<TraceOptions>({
    mode: "lineart",
    colors: 3,
    resolution: 800,
    speckle: 4,
    smoothness: 1,
    splitPerPatch: true,
    cleanEdges: true,
    removeBg: false,
    transparentPaper: true,
    lineSensitivity: 55,
    contrastBoost: true,
  });

  // Alight Motion XML Settings
  const [alightOpts, setAlightOpts] = useState<AlightOptions>({
    preset: "orig",
    cw: 1080,
    ch: 1080,
    duration: 2.0,
    fps: 30,
    grouping: "nested",
    prim: true,
    cstroke: true,
    engine: "max",
    patch: 0.01,
    protect: 2.0,
    exclude: [],
  });

  // State: Processing & Results
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [statusText, setStatusText] = useState<string>("MENUNGGU");
  const [currentSvg, setCurrentSvg] = useState<string>("");
  const [alightResult, setAlightResult] = useState<AlightResult | null>(null);
  const [activeLayers, setActiveLayers] = useState<AlightLayerInfo[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<number>>(new Set());

  // Viewport & UI State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [bgPattern, setBgPattern] = useState<"grid" | "dark" | "white">("grid");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "bad" } | null>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"trace" | "alight" | "layers">("trace");

  // Debounce & Cancellation Refs
  const abortControllerRef = useRef<{ aborted: boolean }>({ aborted: false });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: "ok" | "bad" = "ok") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  };

  /**
   * Run the full pipeline:
   * 1. If raster: runAutoTrace -> produce SVG -> convert to Alight XML
   * 2. If SVG: convert SVG -> Alight XML
   */
  const processPipeline = useCallback(
    async (file: File | string, currentTraceOpts: TraceOptions, currentAlightOpts: AlightOptions) => {
      abortControllerRef.current.aborted = true;
      const newAbortSignal = { aborted: false };
      abortControllerRef.current = newAbortSignal;

      setStatus("busy");
      setStatusText("MEMPROSES");

      try {
        let svgString = "";

        if (inputMode === "raster") {
          setStatusText("TRACING GAMBAR...");
          const { imageData } = await loadAndScaleImage(file, currentTraceOpts.resolution);
          if (newAbortSignal.aborted) return;

          const traceRes = await runAutoTrace(
            imageData,
            currentTraceOpts,
            (pct, text) => {
              if (!newAbortSignal.aborted) {
                setStatusText(`TRACE ${Math.round(pct * 100)}%`);
              }
            },
            newAbortSignal
          );

          if (newAbortSignal.aborted) return;
          svgString = traceRes.svgString;
        } else {
          // Direct SVG string
          svgString = typeof file === "string" ? file : await (file as File).text();
        }

        if (newAbortSignal.aborted) return;
        setCurrentSvg(svgString);

        // Convert SVG to Alight Motion XML
        setStatusText("GENERATING XML...");
        const title = fileName || "vector";
        const converter = new SvgToAlightConverter(currentAlightOpts);
        const amRes = converter.run(svgString, title);

        if (newAbortSignal.aborted) return;

        setAlightResult(amRes);
        setActiveLayers(amRes.layers);

        // Initialize selected layers if not initialized
        if (selectedLayerIds.size === 0 && amRes.layers.length > 0) {
          const allIds = new Set(amRes.layers.map((l) => l.i));
          setSelectedLayerIds(allIds);
        }

        setStatus("done");
        setStatusText("SELESAI");
      } catch (err: any) {
        if (!newAbortSignal.aborted) {
          console.error("Pipeline failed:", err);
          setStatus("error");
          setStatusText("ERROR");
          const msg = err?.message || "Gagal memproses vektor.";
          showToast(msg, "bad");
        }
      }
    },
    [inputMode, fileName, selectedLayerIds]
  );

  /**
   * Auto re-run with 450ms debounce
   */
  useEffect(() => {
    if (!sourceFile && !directSvgText) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const source = inputMode === "raster" ? sourceFile : directSvgText || sourceFile;
      if (source) {
        processPipeline(source, traceOpts, alightOpts);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [traceOpts, alightOpts, inputMode, sourceFile, directSvgText, processPipeline]);

  /**
   * Handle File Selection
   */
  const handleFileSelect = async (file: File) => {
    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const isRaster = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

    if (!isSvg && !isRaster) {
      showToast("Pilih file gambar raster (PNG, JPG, WebP) atau SVG", "bad");
      return;
    }

    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setFileName(cleanName);
    setSourceFile(file);
    setSelectedLayerIds(new Set());
    setZoomLevel(1);

    if (isSvg) {
      setInputMode("svg");
      const text = await file.text();
      setDirectSvgText(text);
      setImagePreviewUrl("");
      processPipeline(text, traceOpts, alightOpts);
    } else {
      setInputMode("raster");
      setDirectSvgText("");
      const objUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objUrl);

      // Analyze image to auto-detect Manga / Line Art vs Color Illustration
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 48;
        c.height = 48;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 48, 48);
          const p = ctx.getImageData(0, 0, 48, 48).data;
          let diffSum = 0;
          for (let i = 0; i < p.length; i += 4) {
            diffSum += Math.abs(p[i] - p[i + 1]) + Math.abs(p[i + 1] - p[i + 2]);
          }
          const avgDiff = diffSum / (48 * 48);
          if (avgDiff < 22) {
            // High probability of black-and-white sketch / manga line art!
            const mangaOpts: TraceOptions = {
              ...traceOpts,
              mode: "lineart",
              colors: 3,
              resolution: 800,
              speckle: 4,
              transparentPaper: true,
              lineSensitivity: 55,
              contrastBoost: true,
            };
            setTraceOpts(mangaOpts);
            showToast("Mode Manga / Line Art aktif otomatis untuk sketsa", "ok");
            processPipeline(file, mangaOpts, alightOpts);
            return;
          }
        }
        processPipeline(file, traceOpts, alightOpts);
      };
      img.onerror = () => {
        processPipeline(file, traceOpts, alightOpts);
      };
      img.src = objUrl;
    }
  };

  /**
   * Clipboard Paste Handler
   */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            showToast("Gambar dari clipboard dimuat", "ok");
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  /**
   * Layer Toggle
   */
  const toggleLayer = (layerId: number) => {
    setSelectedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      const excluded = activeLayers.filter((l) => !next.has(l.i)).map((l) => l.i);
      setAlightOpts((o) => ({ ...o, exclude: excluded }));
      return next;
    });
  };

  const handleSelectAllLayers = (selectAll: boolean) => {
    if (selectAll) {
      const allIds = new Set(activeLayers.map((l) => l.i));
      setSelectedLayerIds(allIds);
      setAlightOpts((o) => ({ ...o, exclude: [] }));
    } else {
      setSelectedLayerIds(new Set());
      setAlightOpts((o) => ({ ...o, exclude: activeLayers.map((l) => l.i) }));
    }
  };

  const handleInvertLayers = () => {
    setSelectedLayerIds((prev) => {
      const next = new Set<number>();
      activeLayers.forEach((l) => {
        if (!prev.has(l.i)) next.add(l.i);
      });
      const excluded = activeLayers.filter((l) => !next.has(l.i)).map((l) => l.i);
      setAlightOpts((o) => ({ ...o, exclude: excluded }));
      return next;
    });
  };

  /**
   * Export Alight Motion XML
   */
  const handleDownloadAlightXml = () => {
    if (!alightResult?.xml) return;
    const blob = new Blob([alightResult.xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}-alight.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Mengunduh ${fileName}-alight.xml`, "ok");
  };

  const handleCopyAlightXml = async () => {
    if (!alightResult?.xml) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(alightResult.xml);
      } else {
        const ta = document.createElement("textarea");
        ta.value = alightResult.xml;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("XML Alight Motion disalin!", "ok");
    } catch {
      showToast("Gagal menyalin XML", "bad");
    }
  };

  /**
   * Export SVG
   */
  const handleDownloadSvg = () => {
    if (!currentSvg) return;
    const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}-trace.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("SVG siap diunduh", "ok");
  };

  const handleCopySvg = async () => {
    if (!currentSvg) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentSvg);
      } else {
        const ta = document.createElement("textarea");
        ta.value = currentSvg;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("Kode SVG disalin!", "ok");
    } catch {
      showToast("Gagal menyalin SVG", "bad");
    }
  };

  const handleReset = () => {
    abortControllerRef.current.aborted = true;
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSourceFile(null);
    setDirectSvgText("");
    setImagePreviewUrl("");
    setCurrentSvg("");
    setAlightResult(null);
    setActiveLayers([]);
    setSelectedLayerIds(new Set());
    setStatus("idle");
    setStatusText("MENUNGGU");
  };

  const selectedCount = selectedLayerIds.size;
  const totalLayersCount = activeLayers.length;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 font-sans text-neutral-100 pb-16 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.svg,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Header Sticky Bar */}
      <header className="sticky top-16 z-20 backdrop-blur-md bg-neutral-950/85 border border-neutral-800/80 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-white to-neutral-300 flex items-center justify-center text-neutral-950 shadow-sm font-bold">
            <Shapes className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Auto Trace <span className="text-neutral-400 font-normal">→</span> Alight XML
            </h1>
            <p className="text-[10px] font-mono text-neutral-400">AM 5.0+ Native XML Project</p>
          </div>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium transition-all ${
            status === "busy"
              ? "bg-neutral-800 text-neutral-200 border border-neutral-700 animate-pulse"
              : status === "done"
              ? "bg-white text-neutral-950 shadow-md font-semibold"
              : status === "error"
              ? "bg-red-950/40 text-red-400 border border-dashed border-red-800/60"
              : "bg-neutral-900 text-neutral-400 border border-neutral-800"
          }`}
        >
          {status === "busy" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : status === "done" ? (
            <Check className="w-3 h-3 text-emerald-600" />
          ) : status === "error" ? (
            <span className="w-2 h-2 rounded-full bg-red-500" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-neutral-600" />
          )}
          <span>{statusText}</span>
        </div>
      </header>

      {/* Upload Zone / Active File Info */}
      {!sourceFile ? (
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelect(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-white bg-neutral-900/70 shadow-lg"
              : "border-neutral-800 hover:border-neutral-600 bg-gradient-to-b from-neutral-900/60 to-neutral-950"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-b from-white to-neutral-300 flex items-center justify-center text-neutral-950 shadow-md">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Pilih Gambar atau SVG</h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            PNG, JPG, WebP di-trace otomatis jadi SVG vektor, atau langsung impor file .SVG untuk dibuatkan proyek Alight Motion XML.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
            <span>Bisa Drag & Drop atau Paste (Ctrl + V)</span>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Source"
                className="w-10 h-10 object-cover rounded-lg border border-neutral-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{fileName}</p>
              <p className="text-[11px] font-mono text-neutral-400">
                {inputMode === "raster" ? "Auto Trace Raster" : "Direct SVG"} •{" "}
                {alightResult ? `${alightResult.src.w}×${alightResult.src.h} px` : "Memproses..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-medium text-neutral-200"
            >
              Ganti
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/50 hover:text-red-400 border border-neutral-800 text-neutral-400"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Tabs Navigation for Settings */}
      <div className="grid grid-cols-3 gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("trace")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "trace"
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Auto Trace</span>
        </button>

        <button
          onClick={() => setActiveTab("alight")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "alight"
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Alight XML</span>
        </button>

        <button
          onClick={() => setActiveTab("layers")}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === "layers"
              ? "bg-white text-neutral-950 shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers ({selectedCount}/{totalLayersCount})</span>
        </button>
      </div>

      {/* TAB 1: Auto Trace Engine Settings */}
      {activeTab === "trace" && (
        <section className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800/90 rounded-xl p-4 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-200">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Preset & Pengaturan Trace</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide">
              {traceOpts.mode === "lineart"
                ? "⚡ Manga & Line Art"
                : traceOpts.mode === "silhouette"
                ? "⚫ Siluet 2-Tone"
                : traceOpts.mode === "manga3"
                ? "📑 Manga 3-Tone"
                : "🎨 Full Color"}
            </span>
          </div>

          {/* Mode Selector Presets */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-300">Pilih Mode / Karakteristik Gambar:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "lineart",
                    colors: 3,
                    resolution: 800,
                    speckle: 4,
                    transparentPaper: true,
                    lineSensitivity: 55,
                    contrastBoost: true,
                  }))
                }
                className={`p-2 rounded-lg border text-left transition-all ${
                  traceOpts.mode === "lineart"
                    ? "bg-white text-neutral-950 font-bold border-white shadow-sm"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <p className="text-xs">⚡ Manga / Sketsa</p>
                <p className={`text-[9px] ${traceOpts.mode === "lineart" ? "text-neutral-700" : "text-neutral-400"}`}>
                  Tinta & arsir detail
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "silhouette",
                    colors: 2,
                    resolution: 800,
                    speckle: 5,
                    transparentPaper: true,
                    lineSensitivity: 50,
                  }))
                }
                className={`p-2 rounded-lg border text-left transition-all ${
                  traceOpts.mode === "silhouette"
                    ? "bg-white text-neutral-950 font-bold border-white shadow-sm"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <p className="text-xs">⚫ Siluet 2-Tone</p>
                <p className={`text-[9px] ${traceOpts.mode === "silhouette" ? "text-neutral-700" : "text-neutral-400"}`}>
                  Hitam murni tegas
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "manga3",
                    colors: 3,
                    resolution: 800,
                    speckle: 4,
                    transparentPaper: true,
                    lineSensitivity: 50,
                  }))
                }
                className={`p-2 rounded-lg border text-left transition-all ${
                  traceOpts.mode === "manga3"
                    ? "bg-white text-neutral-950 font-bold border-white shadow-sm"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <p className="text-xs">📑 Manga 3-Tone</p>
                <p className={`text-[9px] ${traceOpts.mode === "manga3" ? "text-neutral-700" : "text-neutral-400"}`}>
                  Tinta + abu bayang
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "standard",
                    colors: 8,
                    resolution: 640,
                    speckle: 6,
                    transparentPaper: false,
                  }))
                }
                className={`p-2 rounded-lg border text-left transition-all ${
                  traceOpts.mode === "standard"
                    ? "bg-white text-neutral-950 font-bold border-white shadow-sm"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <p className="text-xs">🎨 Full Color</p>
                <p className={`text-[9px] ${traceOpts.mode === "standard" ? "text-neutral-700" : "text-neutral-400"}`}>
                  Vektor warna K-Means
                </p>
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Manga & Line Art Controls */}
          {traceOpts.mode !== "standard" && (
            <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Sensitivitas Garis Tinta (Line Weight)</p>
                  <p className="text-[10px] text-neutral-400">Tinggi = tangkap arsir halus & pensil tipis</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={traceOpts.lineSensitivity ?? 55}
                    onChange={(e) =>
                      setTraceOpts((prev) => ({
                        ...prev,
                        lineSensitivity: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-20 accent-white cursor-pointer"
                  />
                  <span className="w-7 text-right font-mono text-xs font-bold text-white">
                    {traceOpts.lineSensitivity ?? 55}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-medium text-neutral-200">Hapus Latar Kertas Putih (Transparent Ink)</p>
                  <p className="text-[10px] text-neutral-400">Hanya garis gambar yang menjadi vektor, latar transparan</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTraceOpts((prev) => ({
                      ...prev,
                      transparentPaper: prev.transparentPaper === false ? true : false,
                    }))
                  }
                  className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                    traceOpts.transparentPaper !== false ? "bg-white" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-transform ${
                      traceOpts.transparentPaper !== false
                        ? "translate-x-3 bg-neutral-950"
                        : "translate-x-0 bg-neutral-400"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Row 1: Jumlah Warna (Untuk Standard atau Custom) */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Palette className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-200">Tingkat Warna / Arsir</p>
                <p className="text-[10px] text-neutral-400">
                  {traceOpts.mode === "lineart"
                    ? "Tingkat gradasi tinta & bayangan"
                    : "Jumlah warna palet"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={traceOpts.mode !== "standard" ? 6 : 24}
                value={traceOpts.colors}
                onChange={(e) =>
                  setTraceOpts((prev) => ({ ...prev, colors: parseInt(e.target.value, 10) }))
                }
                className="w-20 accent-white cursor-pointer"
              />
              <span className="w-7 text-right font-mono text-xs font-bold text-white">
                {traceOpts.colors}
              </span>
            </div>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Row 2: Detail / Resolusi */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Ruler className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-200">Detail (Resolusi)</p>
                <p className="text-[10px] text-neutral-400">800px direkomendasikan untuk sketsa manga</p>
              </div>
            </div>
            <select
              value={traceOpts.resolution}
              onChange={(e) =>
                setTraceOpts((prev) => ({ ...prev, resolution: parseInt(e.target.value, 10) }))
              }
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-white"
            >
              <option value={320}>320 px (Cepat)</option>
              <option value={480}>480 px</option>
              <option value={640}>640 px (Standar)</option>
              <option value={800}>800 px (Rinci / Manga)</option>
            </select>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Row 3: Buang Noise */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Eraser className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-200">Buang Noise (Speckle)</p>
                <p className="text-[10px] text-neutral-400">Garis arsir memanjang tetap dilindungi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={40}
                value={traceOpts.speckle}
                onChange={(e) =>
                  setTraceOpts((prev) => ({ ...prev, speckle: parseInt(e.target.value, 10) }))
                }
                className="w-20 accent-white cursor-pointer"
              />
              <span className="w-7 text-right font-mono text-xs font-bold text-white">
                {traceOpts.speckle}
              </span>
            </div>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Row 4: Kehalusan Kontur */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Spline className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-neutral-200">Kehalusan Kontur</p>
                <p className="text-[10px] text-neutral-400">Catmull-Rom dengan sudut tajam</p>
              </div>
            </div>
            <select
              value={traceOpts.smoothness}
              onChange={(e) =>
                setTraceOpts((prev) => ({ ...prev, smoothness: parseInt(e.target.value, 10) }))
              }
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-white"
            >
              <option value={0}>0 - Tajam (Lurus)</option>
              <option value={1}>1 - Halus (Standar)</option>
              <option value={2}>2 - Sangat Halus</option>
            </select>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Row 5: Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() =>
                setTraceOpts((prev) => ({ ...prev, splitPerPatch: !prev.splitPerPatch }))
              }
              className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                traceOpts.splitPerPatch
                  ? "bg-neutral-800 border-white text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold">Pisah Patch</p>
                <p className="text-[9px] text-neutral-400">Tiap bagian jadi shape</p>
              </div>
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                  traceOpts.splitPerPatch ? "bg-white" : "bg-neutral-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-transform ${
                    traceOpts.splitPerPatch
                      ? "translate-x-3 bg-neutral-950"
                      : "translate-x-0 bg-neutral-400"
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTraceOpts((prev) => ({ ...prev, cleanEdges: !prev.cleanEdges }))}
              className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                traceOpts.cleanEdges
                  ? "bg-neutral-800 border-white text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold">Rapikan Tepi</p>
                <p className="text-[9px] text-neutral-400">Anti-alias cleaner</p>
              </div>
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                  traceOpts.cleanEdges ? "bg-white" : "bg-neutral-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-transform ${
                    traceOpts.cleanEdges
                      ? "translate-x-3 bg-neutral-950"
                      : "translate-x-0 bg-neutral-400"
                  }`}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setAlightOpts((prev) => ({ ...prev, cstroke: !prev.cstroke }))
              }
              className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                alightOpts.cstroke
                  ? "bg-neutral-800 border-white text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              <div>
                <p className="text-[11px] font-semibold">Hairline Stroke</p>
                <p className="text-[9px] text-neutral-400">Buang stroke artefak</p>
              </div>
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                  alightOpts.cstroke ? "bg-white" : "bg-neutral-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-transform ${
                    alightOpts.cstroke
                      ? "translate-x-3 bg-neutral-950"
                      : "translate-x-0 bg-neutral-400"
                  }`}
                />
              </div>
            </button>
          </div>
        </section>
      )}

      {/* TAB 2: Alight Motion Project Canvas & Export Settings */}
      {activeTab === "alight" && (
        <section className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800/90 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-200">
                <Film className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Canvas & Proyek Alight Motion</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide">
              Alight Preset
            </span>
          </div>

          {/* Aspect Ratio Chips */}
          <div>
            <p className="text-xs font-medium text-neutral-300 mb-1.5">Preset Kanvas</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(["orig", "1:1", "16:9", "9:16", "4:5", "4:3"] as const).map((pr) => (
                <button
                  key={pr}
                  onClick={() => setAlightOpts((prev) => ({ ...prev, preset: pr }))}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-medium transition-all ${
                    alightOpts.preset === pr
                      ? "bg-white text-neutral-950 font-bold border-white"
                      : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  {pr === "orig" ? "Asli" : pr}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Durasi & FPS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-200">Durasi</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  max={60}
                  value={alightOpts.duration}
                  onChange={(e) =>
                    setAlightOpts((prev) => ({ ...prev, duration: parseFloat(e.target.value) || 2 }))
                  }
                  className="w-14 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono text-right text-white"
                />
                <span className="text-xs font-mono text-neutral-400">s</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-200">FPS</span>
              </div>
              <select
                value={alightOpts.fps}
                onChange={(e) =>
                  setAlightOpts((prev) => ({ ...prev, fps: parseInt(e.target.value, 10) }))
                }
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-mono text-white"
              >
                <option value={24}>24 fps</option>
                <option value={25}>25 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
          </div>

          <div className="border-t border-neutral-800/40" />

          {/* Struktur Export: Flat vs Nested */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-300">Struktur Export Alight Motion</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlightOpts((prev) => ({ ...prev, grouping: "nested" }))}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  alightOpts.grouping === "nested"
                    ? "bg-neutral-800 border-white text-white"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                }`}
              >
                <p className="text-xs font-semibold">Nested (embedScene)</p>
                <p className="text-[10px] text-neutral-400">Satu grup rapi di timeline</p>
              </button>

              <button
                type="button"
                onClick={() => setAlightOpts((prev) => ({ ...prev, grouping: "flat" }))}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  alightOpts.grouping === "flat"
                    ? "bg-neutral-800 border-white text-white"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                }`}
              >
                <p className="text-xs font-semibold">Flat (Langsung)</p>
                <p className="text-[10px] text-neutral-400">Semua shape di root layer</p>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: Layer List & Filtering */}
      {activeTab === "layers" && (
        <section className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800/90 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-300" />
              <h3 className="text-sm font-semibold text-white">
                Daftar Layer / Patch ({selectedCount}/{totalLayersCount})
              </h3>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSelectAllLayers(true)}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-neutral-300"
                title="Aktifkan Semua"
              >
                Semua
              </button>
              <button
                onClick={() => handleSelectAllLayers(false)}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-neutral-300"
                title="Kosongkan Semua"
              >
                Kosong
              </button>
              <button
                onClick={handleInvertLayers}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-neutral-300"
                title="Balik Pilihan"
              >
                Balik
              </button>
            </div>
          </div>

          {/* Layer List Scroll */}
          {activeLayers.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">Belum ada layer yang diproses.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {activeLayers.map((layer) => {
                const isSelected = selectedLayerIds.has(layer.i);
                return (
                  <div
                    key={layer.i}
                    onClick={() => toggleLayer(layer.i)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-white"
                        : "bg-neutral-950/60 border-neutral-900/80 text-neutral-400 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-white border-white text-neutral-950"
                            : "border-neutral-600 bg-transparent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {layer.color && (
                        <div
                          className="w-4 h-4 rounded shadow-inner border border-white/20 shrink-0"
                          style={{ backgroundColor: layer.color }}
                        />
                      )}

                      <span className="text-xs font-mono font-medium">{layer.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                      <span>{layer.nodes} node</span>
                      {layer.grad && <span className="text-[10px] text-amber-400">grad</span>}
                      {layer.stroke && <span className="text-[10px] text-cyan-400">strk</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SVG & Vector Preview Card */}
      {currentSvg && (
        <section className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800/90 rounded-xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            {/* Background Selector */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setBgPattern("grid")}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  bgPattern === "grid"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Latar Transparan / Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setBgPattern("dark")}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  bgPattern === "dark"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Latar Hitam"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setBgPattern("white")}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  bgPattern === "white"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Latar Putih"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="p-1.5 rounded-md text-neutral-400 hover:text-white"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-[11px] font-mono font-semibold text-neutral-300 hover:text-white"
                title="Pas Layar (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                className="p-1.5 rounded-md text-neutral-400 hover:text-white"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            className={`relative w-full h-80 rounded-lg overflow-auto border border-neutral-800 flex items-center justify-center p-4 transition-colors ${
              bgPattern === "grid"
                ? "bg-[conic-gradient(#262626_25%,#171717_0_50%,#262626_0_75%,#171717_0)] bg-[size:16px_16px]"
                : bgPattern === "dark"
                ? "bg-neutral-950"
                : "bg-white"
            }`}
          >
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
              className="m-auto flex items-center justify-center max-w-full max-h-full"
              dangerouslySetInnerHTML={{ __html: currentSvg }}
            />
          </div>

          {/* Stats Bar (2 Columns / 4 Cells) */}
          {alightResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Layer Dipilih</p>
                <p className="text-sm font-mono font-bold text-white">
                  {selectedCount} / {totalLayersCount}
                </p>
              </div>
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Warna Palet</p>
                <p className="text-sm font-mono font-bold text-white">{alightResult.stats.colors}</p>
              </div>
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Alight XML</p>
                <p className="text-sm font-mono font-bold text-white">
                  {(alightResult.xmlBytes / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Kanvas AM</p>
                <p className="text-sm font-mono font-bold text-white">
                  {alightResult.canvas.w}×{alightResult.canvas.h}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Main Action Buttons Grid: Alight Motion XML & SVG */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadAlightXml}
            disabled={!alightResult?.xml}
            className="flex items-center justify-center gap-2 min-h-[44px] px-3.5 rounded-xl bg-gradient-to-b from-white to-neutral-200 hover:from-neutral-100 hover:to-neutral-300 text-neutral-950 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/10"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Alight XML</span>
          </button>

          <button
            onClick={handleCopyAlightXml}
            disabled={!alightResult?.xml}
            className="flex items-center justify-center gap-2 min-h-[44px] px-3.5 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 border border-neutral-700 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <Copy className="w-4 h-4" />
            <span>Salin XML Alight</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadSvg}
            disabled={!currentSvg}
            className="flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Berkas SVG</span>
          </button>

          <button
            onClick={handleCopySvg}
            disabled={!currentSvg}
            className="flex items-center justify-center gap-2 min-h-[40px] px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Kode SVG</span>
          </button>
        </div>

        {alightResult?.xml && (
          <button
            onClick={() => setIsXmlModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Lihat Isi XML Alight Motion Lengkap ({((alightResult.xmlBytes || 0) / 1024).toFixed(1)} KB)</span>
          </button>
        )}
      </div>

      {/* XML Full Inspector Modal */}
      {isXmlModalOpen && alightResult?.xml && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-white" />
              <h4 className="text-sm font-bold text-white">XML Proyek Alight Motion</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAlightXml}
                className="px-3 py-1 rounded-lg bg-white text-neutral-950 font-bold text-xs"
              >
                Salin
              </button>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={alightResult.xml}
            className="flex-1 mt-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-300 resize-none focus:outline-none"
          />
        </div>
      )}

      {/* Bottom Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl text-xs font-medium border ${
              toast.type === "ok"
                ? "bg-neutral-900 text-white border-neutral-700 shadow-emerald-950/20"
                : "bg-red-950 text-red-200 border-red-800 shadow-red-950/40"
            }`}
          >
            {toast.type === "ok" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
