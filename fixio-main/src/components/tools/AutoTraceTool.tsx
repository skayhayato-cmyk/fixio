import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TraceOptions,
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
  Layers,
  Download,
  Copy,
  Check,
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
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

interface AutoTraceToolProps {
  onSelectTool?: (toolId: string) => void;
}

export const AutoTraceTool: React.FC<AutoTraceToolProps> = ({ onSelectTool }) => {
  // Input Mode: "raster" (Auto Trace) or "svg" (Direct SVG)
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
   * Run the full pipeline
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
            (pct) => {
              if (!newAbortSignal.aborted) {
                setStatusText(`TRACE ${Math.round(pct * 100)}%`);
              }
            },
            newAbortSignal
          );

          if (newAbortSignal.aborted) return;
          svgString = traceRes.svgString;
        } else {
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
    <div className="space-y-6 w-full max-w-full overflow-hidden min-w-0">
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

      {/* Tool Header - Fixio Standard */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Shapes className="w-4 h-4" />
          <span>Vector Tracer & Alight Motion Project</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
            Auto Trace Image to SVG
          </h2>
          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              status === "busy"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                : status === "done"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : status === "error"
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                : "bg-black/5 dark:bg-white/10 text-[#8e8e93]"
            }`}
          >
            {status === "busy" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === "done" ? (
              <Check className="w-3.5 h-3.5" />
            ) : null}
            <span>{statusText}</span>
          </div>
        </div>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Ubah gambar raster (PNG/JPG/WebP/Sketsa Manga) menjadi vektor SVG berlapis warna & konversi langsung ke Alight Motion XML.
        </p>
      </div>

      {/* Upload Zone / Active File Info */}
      {!sourceFile ? (
        <div
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
          className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-[#007aff] dark:border-[#0a84ff] bg-blue-50/50 dark:bg-blue-950/20"
              : "border-black/10 dark:border-white/10 hover:border-[#007aff]/50 bg-slate-50/60 dark:bg-[#121214]"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#007aff]/10 dark:bg-[#0a84ff]/15 text-[#007aff] dark:text-[#0a84ff] flex items-center justify-center shadow-sm">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-1">
            Pilih atau Tarik Gambar / SVG ke Sini
          </h3>
          <p className="text-xs text-[#8e8e93] dark:text-[#98989d] max-w-sm mx-auto">
            Mendukung PNG, JPG, WebP, GIF, & berkas SVG. Diproses 100% cepat di browser tanpa batas ukuran.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-medium text-black dark:text-white">
            <Sparkles className="w-3.5 h-3.5 text-[#007aff]" />
            <span>Mendukung Paste dari Clipboard (Ctrl + V)</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/60 dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Source"
                className="w-12 h-12 object-cover rounded-xl border border-black/10 dark:border-white/10 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#007aff]/10 dark:bg-[#0a84ff]/15 text-[#007aff] dark:text-[#0a84ff] flex items-center justify-center shrink-0">
                <FileCode className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-black dark:text-white truncate">{fileName}</p>
              <p className="text-xs text-[#8e8e93] dark:text-[#98989d]">
                {inputMode === "raster" ? "Auto Trace Raster" : "Direct SVG"} •{" "}
                {alightResult ? `${alightResult.src.w}×${alightResult.src.h} px` : "Memproses..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-black dark:text-white transition-colors"
            >
              Ganti
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-red-500/10 hover:text-red-500 text-[#8e8e93] transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation for Settings - Fixio Standard */}
      <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("trace")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "trace"
              ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm"
              : "text-[#8e8e93] hover:text-black dark:hover:text-white"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Pengaturan Trace</span>
        </button>

        <button
          onClick={() => setActiveTab("alight")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "alight"
              ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm"
              : "text-[#8e8e93] hover:text-black dark:hover:text-white"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Alight Motion XML</span>
        </button>

        <button
          onClick={() => setActiveTab("layers")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "layers"
              ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-sm"
              : "text-[#8e8e93] hover:text-black dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layer ({selectedCount}/{totalLayersCount})</span>
        </button>
      </div>

      {/* TAB 1: Auto Trace Engine Settings */}
      {activeTab === "trace" && (
        <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          {/* Preset Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black dark:text-white">
              Pilih Karakteristik / Mode Gambar:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                className={`p-3 rounded-xl border text-left transition-all ${
                  traceOpts.mode === "lineart"
                    ? "bg-[#007aff]/10 dark:bg-[#0a84ff]/15 border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] font-bold shadow-sm"
                    : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white hover:border-[#007aff]/40"
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Manga / Sketsa
                </p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">Tinta & arsir detail</p>
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
                className={`p-3 rounded-xl border text-left transition-all ${
                  traceOpts.mode === "silhouette"
                    ? "bg-[#007aff]/10 dark:bg-[#0a84ff]/15 border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] font-bold shadow-sm"
                    : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white hover:border-[#007aff]/40"
                }`}
              >
                <p className="text-xs font-bold">Siluet 2-Tone</p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">Hitam murni tegas</p>
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
                className={`p-3 rounded-xl border text-left transition-all ${
                  traceOpts.mode === "manga3"
                    ? "bg-[#007aff]/10 dark:bg-[#0a84ff]/15 border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] font-bold shadow-sm"
                    : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white hover:border-[#007aff]/40"
                }`}
              >
                <p className="text-xs font-bold">Manga 3-Tone</p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">Tinta + abu bayang</p>
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
                className={`p-3 rounded-xl border text-left transition-all ${
                  traceOpts.mode === "standard"
                    ? "bg-[#007aff]/10 dark:bg-[#0a84ff]/15 border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] font-bold shadow-sm"
                    : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white hover:border-[#007aff]/40"
                }`}
              >
                <p className="text-xs font-bold">Multi-Warna</p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">Vektor warna K-Means</p>
              </button>
            </div>
          </div>

          {/* Manga Mode Specific Controls */}
          {traceOpts.mode !== "standard" && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">
                    Sensitivitas Garis Tinta (Ambang Tinta)
                  </p>
                  <p className="text-[11px] text-[#8e8e93]">
                    Semakin tinggi, semakin banyak arsir halus & pensil yang terdeteksi
                  </p>
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
                    className="w-24 accent-[#007aff] dark:accent-[#0a84ff] cursor-pointer"
                  />
                  <span className="w-8 text-right font-mono text-xs font-bold text-black dark:text-white">
                    {traceOpts.lineSensitivity ?? 55}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">
                    Hapus Latar Kertas Putih (Transparent Ink)
                  </p>
                  <p className="text-[11px] text-[#8e8e93]">
                    Hanya garis tinta dan arsir yang menjadi vektor, latar menjadi transparan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTraceOpts((prev) => ({
                      ...prev,
                      transparentPaper: prev.transparentPaper === false ? true : false,
                    }))
                  }
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    traceOpts.transparentPaper !== false
                      ? "bg-[#007aff] dark:bg-[#0a84ff]"
                      : "bg-black/20 dark:bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      traceOpts.transparentPaper !== false ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Setting Sliders & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Jumlah Warna */}
            <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#007aff]" />
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">Jumlah Warna</p>
                  <p className="text-[10px] text-[#8e8e93]">Gradasi warna/arsir</p>
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
                  className="w-20 accent-[#007aff] dark:accent-[#0a84ff]"
                />
                <span className="w-6 text-right font-mono text-xs font-bold text-black dark:text-white">
                  {traceOpts.colors}
                </span>
              </div>
            </div>

            {/* Resolusi */}
            <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#007aff]" />
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">Detail Resolusi</p>
                  <p className="text-[10px] text-[#8e8e93]">Sisi terpanjang kanvas</p>
                </div>
              </div>
              <select
                value={traceOpts.resolution}
                onChange={(e) =>
                  setTraceOpts((prev) => ({ ...prev, resolution: parseInt(e.target.value, 10) }))
                }
                className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold text-black dark:text-white focus:outline-none"
              >
                <option value={320}>320 px</option>
                <option value={480}>480 px</option>
                <option value={640}>640 px</option>
                <option value={800}>800 px (Manga)</option>
              </select>
            </div>

            {/* Buang Noise */}
            <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eraser className="w-4 h-4 text-[#007aff]" />
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">Buang Noise</p>
                  <p className="text-[10px] text-[#8e8e93]">Filter speckle debu</p>
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
                  className="w-20 accent-[#007aff] dark:accent-[#0a84ff]"
                />
                <span className="w-6 text-right font-mono text-xs font-bold text-black dark:text-white">
                  {traceOpts.speckle}
                </span>
              </div>
            </div>

            {/* Kehalusan */}
            <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Spline className="w-4 h-4 text-[#007aff]" />
                <div>
                  <p className="text-xs font-semibold text-black dark:text-white">Kehalusan Kontur</p>
                  <p className="text-[10px] text-[#8e8e93]">Kurva Bezier</p>
                </div>
              </div>
              <select
                value={traceOpts.smoothness}
                onChange={(e) =>
                  setTraceOpts((prev) => ({ ...prev, smoothness: parseInt(e.target.value, 10) }))
                }
                className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold text-black dark:text-white focus:outline-none"
              >
                <option value={0}>0 - Tajam</option>
                <option value={1}>1 - Halus</option>
                <option value={2}>2 - Sangat Halus</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Alight Motion XML Settings */}
      {activeTab === "alight" && (
        <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          {/* Preset Rasio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-black dark:text-white">
              Preset Rasio Proyek Alight Motion:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(["orig", "1:1", "16:9", "9:16", "4:5", "4:3"] as const).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setAlightOpts((prev) => ({ ...prev, preset: pr }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                    alightOpts.preset === pr
                      ? "bg-[#007aff] dark:bg-[#0a84ff] text-white border-transparent shadow-sm"
                      : "bg-white dark:bg-[#1c1c1e] text-black dark:text-white border-black/5 dark:border-white/10"
                  }`}
                >
                  {pr === "orig" ? "Asli" : pr}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#007aff]" />
                <span className="text-xs font-semibold text-black dark:text-white">Durasi Proyek</span>
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
                  className="w-14 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-right text-black dark:text-white"
                />
                <span className="text-xs text-[#8e8e93]">s</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#007aff]" />
                <span className="text-xs font-semibold text-black dark:text-white">FPS</span>
              </div>
              <select
                value={alightOpts.fps}
                onChange={(e) =>
                  setAlightOpts((prev) => ({ ...prev, fps: parseInt(e.target.value, 10) }))
                }
                className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold text-black dark:text-white"
              >
                <option value={24}>24 fps</option>
                <option value={25}>25 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
          </div>

          {/* Struktur Export */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-black dark:text-white">
              Struktur Export Alight Motion:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlightOpts((prev) => ({ ...prev, grouping: "nested" }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  alightOpts.grouping === "nested"
                    ? "bg-[#007aff]/10 dark:bg-[#0a84ff]/15 border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] font-bold"
                    : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white"
                }`}
              >
                <p className="text-xs font-bold">Nested (embedScene)</p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">Satu grup rapi di timeline</p>
              </button>

              <button
                type="button"
                onClick={() => setAlightOpts((prev) => ({ ...prev, grouping: "flat" }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  alightOpts.grouping === "flat"
                    ? "bg-[#007aff]/10 dark:bg-[#0a84ff]/15 border-[#007aff] dark:border-[#0a84ff] text-[#007aff] dark:text-[#0a84ff] font-bold"
                    : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white"
                }`}
              >
                <p className="text-xs font-bold">Flat (Langsung)</p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">Semua shape di root layer</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Layer List & Filtering */}
      {activeTab === "layers" && (
        <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#007aff] dark:text-[#0a84ff]" />
              <h3 className="text-base font-bold text-black dark:text-white">
                Daftar Layer / Patch ({selectedCount}/{totalLayersCount})
              </h3>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSelectAllLayers(true)}
                className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-semibold text-black dark:text-white"
              >
                Semua
              </button>
              <button
                onClick={() => handleSelectAllLayers(false)}
                className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-semibold text-black dark:text-white"
              >
                Kosong
              </button>
              <button
                onClick={handleInvertLayers}
                className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-xs font-semibold text-black dark:text-white"
              >
                Balik
              </button>
            </div>
          </div>

          {activeLayers.length === 0 ? (
            <p className="text-xs text-[#8e8e93] py-4 text-center">Belum ada layer yang diproses.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {activeLayers.map((layer) => {
                const isSelected = selectedLayerIds.has(layer.i);
                return (
                  <div
                    key={layer.i}
                    onClick={() => toggleLayer(layer.i)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-black dark:text-white shadow-sm"
                        : "bg-black/5 dark:bg-white/5 border-transparent text-[#8e8e93] opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-[#007aff] dark:bg-[#0a84ff] border-transparent text-white"
                            : "border-black/20 dark:border-white/20 bg-transparent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {layer.color && (
                        <div
                          className="w-4 h-4 rounded-md shadow-inner border border-black/10 dark:border-white/20 shrink-0"
                          style={{ backgroundColor: layer.color }}
                        />
                      )}

                      <span className="text-xs font-mono font-medium">{layer.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-[#8e8e93]">
                      <span>{layer.nodes} node</span>
                      {layer.grad && <span className="text-[10px] text-amber-500 font-bold">grad</span>}
                      {layer.stroke && <span className="text-[10px] text-cyan-500 font-bold">strk</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SVG & Vector Preview Card */}
      {currentSvg && (
        <div className="space-y-4 bg-slate-50/60 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
            {/* Background Selector */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setBgPattern("grid")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  bgPattern === "grid"
                    ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                    : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                }`}
                title="Latar Transparan / Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBgPattern("dark")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  bgPattern === "dark"
                    ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                    : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                }`}
                title="Latar Hitam"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBgPattern("white")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  bgPattern === "white"
                    ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
                    : "text-[#8e8e93] hover:text-black dark:hover:text-white"
                }`}
                title="Latar Putih"
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="p-1.5 rounded-lg text-[#8e8e93] hover:text-black dark:hover:text-white"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-xs font-mono font-bold text-black dark:text-white"
                title="Pas Layar (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                className="p-1.5 rounded-lg text-[#8e8e93] hover:text-black dark:hover:text-white"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            className={`relative w-full max-w-full h-80 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 flex items-center justify-center p-4 transition-colors ${
              bgPattern === "grid"
                ? "bg-[conic-gradient(#e2e8f0_25%,#ffffff_0_50%,#e2e8f0_0_75%,#ffffff_0)] dark:bg-[conic-gradient(#262626_25%,#171717_0_50%,#262626_0_75%,#171717_0)] bg-[size:16px_16px]"
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
              className="m-auto flex items-center justify-center max-w-full max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:h-auto overflow-hidden"
              dangerouslySetInnerHTML={{ __html: currentSvg }}
            />
          </div>

          {/* Stats Bar */}
          {alightResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#8e8e93] uppercase font-bold">Layer Aktif</p>
                <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                  {selectedCount} / {totalLayersCount}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#8e8e93] uppercase font-bold">Palet Warna</p>
                <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                  {alightResult.stats.colors}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#8e8e93] uppercase font-bold">Ukuran XML</p>
                <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                  {(alightResult.xmlBytes / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#8e8e93] uppercase font-bold">Dimensi Kanvas</p>
                <p className="text-sm font-mono font-bold text-black dark:text-white mt-0.5">
                  {alightResult.canvas.w}×{alightResult.canvas.h}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Action Buttons Grid - Fixio Standard */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadAlightXml}
            disabled={!alightResult?.xml}
            className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-[#007aff] dark:bg-[#0a84ff] hover:bg-[#0062cc] dark:hover:bg-[#0071e3] text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Alight XML</span>
          </button>

          <button
            onClick={handleCopyAlightXml}
            disabled={!alightResult?.xml}
            className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-black/5 dark:border-white/10 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Salin XML Alight</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadSvg}
            disabled={!currentSvg}
            className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-black dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Berkas SVG</span>
          </button>

          <button
            onClick={handleCopySvg}
            disabled={!currentSvg}
            className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c1e] hover:bg-black/5 dark:hover:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-black dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Kode SVG</span>
          </button>
        </div>

        {alightResult?.xml && (
          <button
            onClick={() => setIsXmlModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium text-[#8e8e93] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            <span>Lihat Isi XML Proyek Lengkap ({((alightResult.xmlBytes || 0) / 1024).toFixed(1)} KB)</span>
          </button>
        )}
      </div>

      {/* XML Full Inspector Modal */}
      {isXmlModalOpen && alightResult?.xml && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 flex flex-col h-full max-h-[90vh] max-w-2xl mx-auto w-full shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#007aff]" />
                <h4 className="text-sm font-bold text-black dark:text-white">XML Proyek Alight Motion</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAlightXml}
                  className="px-3 py-1.5 rounded-lg bg-[#007aff] text-white font-bold text-xs"
                >
                  Salin
                </button>
                <button
                  onClick={() => setIsXmlModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#8e8e93] hover:text-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={alightResult.xml}
              className="flex-1 mt-3 bg-slate-50 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-black dark:text-white resize-none focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold ${
              toast.type === "ok"
                ? "bg-black/90 text-white dark:bg-white dark:text-black"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "ok" ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-200" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
