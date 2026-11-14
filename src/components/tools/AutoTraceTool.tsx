import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  X,
  Sparkles,
  Eye,
  SplitSquareHorizontal,
  ShieldCheck,
} from "lucide-react";

interface AutoTraceToolProps {
  onSelectTool?: (toolId: string) => void;
}

export const AutoTraceTool: React.FC<AutoTraceToolProps> = () => {
  // Input Mode: "raster" (Auto Trace) or "svg" (Direct SVG)
  const [inputMode, setInputMode] = useState<"raster" | "svg">("raster");

  // Source Files & Previews
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("vector");
  const [directSvgText, setDirectSvgText] = useState<string>("");

  // Trace Settings — Default to Full Color High-Accuracy Mode!
  const [traceOpts, setTraceOpts] = useState<TraceOptions>({
    mode: "standard",
    colors: 16,
    resolution: 1000,
    speckle: 2,
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
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [exactPaletteUsed, setExactPaletteUsed] = useState<boolean>(false);
  const [alightResult, setAlightResult] = useState<AlightResult | null>(null);
  const [activeLayers, setActiveLayers] = useState<AlightLayerInfo[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<number>>(new Set());

  // Viewport & UI State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [bgPattern, setBgPattern] = useState<"grid" | "dark" | "white">("grid");
  const [previewMode, setPreviewMode] = useState<"svg" | "compare" | "original">("svg");
  const [compareSlider, setCompareSlider] = useState<number>(50);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "bad" } | null>(null);
  const [isXmlModalOpen, setIsXmlModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"trace" | "alight" | "layers">("trace");

  // Debounce & Cancellation Refs
  const abortControllerRef = useRef<{ aborted: boolean }>({ aborted: false });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const alightOptsRef = useRef<AlightOptions>(alightOpts);
  alightOptsRef.current = alightOpts;

  const showToast = useCallback((message: string, type: "ok" | "bad" = "ok") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2800);
  }, []);

  /**
   * Convert current SVG string to Alight Motion XML without re-tracing the raster image
   */
  const runXmlConversion = useCallback(
    (svgString: string, opts: AlightOptions, titleName: string, resetSelection: boolean) => {
      try {
        const converter = new SvgToAlightConverter(opts);
        const amRes = converter.run(svgString, titleName || "vector");
        setAlightResult(amRes);
        setActiveLayers(amRes.layers);

        if (resetSelection) {
          setSelectedLayerIds(new Set(amRes.layers.map((l) => l.i)));
        }
      } catch (err: any) {
        console.error("XML conversion error:", err);
      }
    },
    []
  );

  /**
   * Run Raster Auto-Trace + XML Conversion
   */
  const processTracePipeline = useCallback(
    async (file: File | string, currentTraceOpts: TraceOptions, currentFileName?: string) => {
      abortControllerRef.current.aborted = true;
      const newAbortSignal = { aborted: false };
      abortControllerRef.current = newAbortSignal;

      setStatus("busy");
      setStatusText("MEMPROSES");

      try {
        let svgString = "";
        const isSvgArg =
          typeof file === "string" ||
          (file instanceof File &&
            (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")));

        if (!isSvgArg && typeof file !== "string") {
          setStatusText("MEMUAT GAMBAR...");
          const { imageData } = await loadAndScaleImage(file, currentTraceOpts.resolution);
          if (newAbortSignal.aborted) return;

          const traceRes = await runAutoTrace(
            imageData,
            currentTraceOpts,
            (pct, stage) => {
              if (!newAbortSignal.aborted) {
                setStatusText(`${Math.round(pct * 100)}% • ${stage.split("...")[0].toUpperCase()}`);
              }
            },
            newAbortSignal
          );

          if (newAbortSignal.aborted) return;
          svgString = traceRes.svgString;
          setExtractedPalette(traceRes.paletteHexes);
          setExactPaletteUsed(Boolean(traceRes.exactPaletteUsed));
        } else {
          svgString = typeof file === "string" ? file : await (file as File).text();
          setExtractedPalette([]);
          setExactPaletteUsed(false);
        }

        if (newAbortSignal.aborted) return;
        setCurrentSvg(svgString);

        // Reset excluded layers for freshly traced SVG
        const freshAlightOpts: AlightOptions = { ...alightOptsRef.current, exclude: [] };
        setAlightOpts(freshAlightOpts);

        setStatusText("MEMBUAT XML...");
        runXmlConversion(svgString, freshAlightOpts, currentFileName || fileName, true);

        setStatus("done");
        setStatusText("AKURAT 100%");
      } catch (err: any) {
        if (!newAbortSignal.aborted) {
          console.error("Pipeline failed:", err);
          setStatus("error");
          setStatusText("ERROR");
          showToast(err?.message || "Gagal memproses vektor.", "bad");
        }
      }
    },
    [inputMode, fileName, runXmlConversion, showToast]
  );

  /**
   * Re-run Auto Trace only when traceOpts or sourceFile changes (400ms debounce)
   */
  const isFirstMountRef = useRef(true);
  const skipNextDebounceRef = useRef(false);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    if (!sourceFile && !directSvgText) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const source = inputMode === "raster" ? sourceFile : directSvgText || sourceFile;
      if (source) {
        processTracePipeline(source, traceOpts);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceOpts, inputMode, sourceFile, directSvgText]);

  /**
   * Re-run ONLY Alight Motion XML converter instantaneously when alightOpts change
   */
  useEffect(() => {
    if (!currentSvg) return;
    runXmlConversion(currentSvg, alightOpts, fileName, false);
  }, [alightOpts, currentSvg, fileName, runXmlConversion]);

  /**
   * Handle File Selection with Smart Color vs Line-Art Detection
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
      const isRaster =
        file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

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
      setPreviewMode("svg");

      if (isSvg) {
        setInputMode("svg");
        const text = await file.text();
        setDirectSvgText(text);
        setImagePreviewUrl("");
        skipNextDebounceRef.current = true;
        processTracePipeline(text, traceOpts, cleanName);
      } else {
        setInputMode("raster");
        setDirectSvgText("");
        const objUrl = URL.createObjectURL(file);
        setImagePreviewUrl(objUrl);

        // Analyze chromatic richness on 96x96 sample to pick optimal color vs lineart mode
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = 96;
          c.height = 96;
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 96, 96);
            const p = ctx.getImageData(0, 0, 96, 96).data;
            let opaqueCount = 0;
            let chromaticCount = 0;
            let diffSum = 0;

            for (let i = 0; i < p.length; i += 4) {
              if (p[i + 3] < 128) continue;
              opaqueCount++;
              const maxC = Math.max(p[i], p[i + 1], p[i + 2]);
              const minC = Math.min(p[i], p[i + 1], p[i + 2]);
              const chroma = maxC - minC;
              diffSum += chroma;
              if (chroma > 16) chromaticCount++;
            }

            const chromaRatio = opaqueCount > 0 ? chromaticCount / opaqueCount : 0;
            const avgChroma = opaqueCount > 0 ? diffSum / opaqueCount : 0;

            if (chromaRatio < 0.015 && avgChroma < 8) {
              // Genuinely monochrome / manga ink image
              const mangaOpts: TraceOptions = {
                ...traceOpts,
                mode: "lineart",
                colors: 3,
                resolution: 1000,
                speckle: 2,
                smoothness: 1,
                cleanEdges: true,
                transparentPaper: true,
                lineSensitivity: 55,
                contrastBoost: true,
              };
              skipNextDebounceRef.current = true;
              setTraceOpts(mangaOpts);
              showToast("Sketsa / Line Art terdeteksi otomatis", "ok");
              processTracePipeline(file, mangaOpts, cleanName);
              return;
            } else {
              // Full-color illustration, logo, anime, or photo -> Force Accurate Full-Color Mode!
              const colorOpts: TraceOptions = {
                ...traceOpts,
                mode: "standard",
                colors: traceOpts.mode === "standard" ? Math.max(12, traceOpts.colors) : 16,
                resolution: Math.max(1000, traceOpts.resolution),
                speckle: Math.min(2, traceOpts.speckle),
                smoothness: 1,
                cleanEdges: true,
              };
              skipNextDebounceRef.current = true;
              setTraceOpts(colorOpts);
              showToast("Mode Warna Akurat aktif otomatis sesuai warna gambar", "ok");
              processTracePipeline(file, colorOpts, cleanName);
              return;
            }
          }
          skipNextDebounceRef.current = true;
          processTracePipeline(file, traceOpts, cleanName);
        };
        img.onerror = () => {
          skipNextDebounceRef.current = true;
          processTracePipeline(file, traceOpts, cleanName);
        };
        img.src = objUrl;
      }
    },
    [imagePreviewUrl, processTracePipeline, showToast, traceOpts]
  );

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
  }, [handleFileSelect, showToast]);

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

  const handleCopyColor = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      showToast(`Warna ${hex.toUpperCase()} disalin`, "ok");
    } catch {
      // Ignore
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
    setExtractedPalette([]);
    setExactPaletteUsed(false);
    setAlightResult(null);
    setActiveLayers([]);
    setSelectedLayerIds(new Set());
    setStatus("idle");
    setStatusText("MENUNGGU");
  };

  const selectedCount = selectedLayerIds.size;
  const totalLayersCount = activeLayers.length;

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden min-w-0">
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

      {/* Tool Header */}
      <div className="border-b border-zinc-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs mb-1">
          <Shapes className="w-4 h-4" />
          <span>Precision Vector Tracer & Alight Motion XML</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Auto Trace Image to SVG
          </h2>
          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              status === "busy"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse"
                : status === "done"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                : status === "error"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                : "bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10"
            }`}
          >
            {status === "busy" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === "done" ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : null}
            <span className="tabular-data">{statusText}</span>
          </div>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">
          Konversi gambar ke SVG berlapis warna persis seperti gambar aslinya dengan presisi kontur sub-piksel & ekspor ke Alight Motion XML.
        </p>
      </div>

      {/* Upload Zone / Active File Info */}
      {!sourceFile ? (
        <motion.div
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
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
              ? "border-amber-500 bg-amber-500/10"
              : "border-zinc-300 dark:border-white/15 hover:border-amber-500/60 bg-zinc-50 dark:bg-[#141418]"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shadow-xs">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-1">
            Pilih atau Tarik Gambar / SVG ke Sini
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Mendukung PNG, JPG, WebP, GIF, & berkas SVG. Warna & bentuk dijiplak akurat langsung di browser.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-200/70 dark:bg-white/10 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mendukung Paste Clipboard (Ctrl + V)</span>
          </div>
        </motion.div>
      ) : (
        <div className="bg-zinc-50 dark:bg-[#141418] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Source"
                className="w-12 h-12 object-cover rounded-xl border border-zinc-200 dark:border-white/10 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileCode className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{fileName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {inputMode === "raster"
                  ? exactPaletteUsed
                    ? "Exact Color Match"
                    : "Perceptual Color Match"
                  : "Direct SVG"}{" "}
                • {alightResult ? `${alightResult.src.w}×${alightResult.src.h} px` : "Memproses..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-zinc-200/80 dark:bg-white/10 hover:bg-zinc-300/80 dark:hover:bg-white/15 text-xs font-semibold text-zinc-900 dark:text-white transition-colors cursor-pointer"
            >
              Ganti
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-zinc-200/80 dark:bg-white/10 hover:bg-rose-500/15 hover:text-rose-500 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200/80 dark:border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("trace")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "trace"
              ? "bg-white dark:bg-[#242429] text-amber-600 dark:text-amber-400 shadow-xs font-bold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Pengaturan Trace</span>
        </button>

        <button
          onClick={() => setActiveTab("alight")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "alight"
              ? "bg-white dark:bg-[#242429] text-amber-600 dark:text-amber-400 shadow-xs font-bold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Alight Motion XML</span>
        </button>

        <button
          onClick={() => setActiveTab("layers")}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "layers"
              ? "bg-white dark:bg-[#242429] text-amber-600 dark:text-amber-400 shadow-xs font-bold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layer ({selectedCount}/{totalLayersCount})</span>
        </button>
      </div>

      {/* TAB 1: Auto Trace Engine Settings */}
      {activeTab === "trace" && (
        <div className="space-y-4 bg-zinc-50 dark:bg-[#141418] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xs">
          {/* Preset Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-900 dark:text-white">
              Preset Akurasi & Mode Tracing:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "standard",
                    colors: 16,
                    resolution: 1000,
                    speckle: 2,
                    smoothness: 1,
                    cleanEdges: true,
                    transparentPaper: false,
                  }))
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  traceOpts.mode === "standard" && traceOpts.colors <= 24
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                    : "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-amber-500/50"
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" /> Warna Akurat
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Sesuai warna asli (16)
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "standard",
                    colors: 32,
                    resolution: 1200,
                    speckle: 1,
                    smoothness: 0,
                    cleanEdges: false,
                    transparentPaper: false,
                  }))
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  traceOpts.mode === "standard" && traceOpts.colors > 24
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                    : "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-amber-500/50"
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Ultra Detail 100%
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  32+ warna, presisi tajam
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "lineart",
                    colors: 3,
                    resolution: 1000,
                    speckle: 2,
                    smoothness: 1,
                    transparentPaper: true,
                    lineSensitivity: 55,
                    contrastBoost: true,
                  }))
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  traceOpts.mode === "lineart"
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                    : "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-amber-500/50"
                }`}
              >
                <p className="text-xs font-bold">Manga / Sketsa</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Tinta & arsir hitam
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTraceOpts((prev) => ({
                    ...prev,
                    mode: "silhouette",
                    colors: 2,
                    resolution: 1000,
                    speckle: 3,
                    smoothness: 1,
                    transparentPaper: true,
                    lineSensitivity: 50,
                  }))
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  traceOpts.mode === "silhouette"
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold shadow-xs"
                    : "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:border-amber-500/50"
                }`}
              >
                <p className="text-xs font-bold">Siluet 2-Tone</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Hitam murni tegas
                </p>
              </button>
            </div>
          </div>

          {/* Manga Mode Specific Controls */}
          {traceOpts.mode !== "standard" && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#1c1c21] border border-zinc-200 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Sensitivitas Garis Tinta (Ambang Tinta)
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Semakin tinggi, semakin banyak arsir halus yang terdeteksi
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
                    className="w-24 accent-amber-500 cursor-pointer"
                  />
                  <span className="w-9 text-right font-mono text-xs font-bold text-zinc-900 dark:text-white tabular-data">
                    {traceOpts.lineSensitivity ?? 55}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/70 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Hapus Latar Kertas Putih (Transparent Ink)
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Hanya garis tinta yang menjadi vektor, kertas menjadi transparan
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
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    traceOpts.transparentPaper !== false
                      ? "bg-amber-500"
                      : "bg-zinc-300 dark:bg-white/20"
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
            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Palette className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Jumlah Warna</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {traceOpts.mode === "standard" ? "Maksimal 48 warna" : "Gradasi arsir"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="range"
                  min={2}
                  max={traceOpts.mode !== "standard" ? 6 : 48}
                  value={traceOpts.colors}
                  onChange={(e) =>
                    setTraceOpts((prev) => ({ ...prev, colors: parseInt(e.target.value, 10) }))
                  }
                  className="w-20 accent-amber-500 cursor-pointer"
                />
                <span className="w-6 text-right font-mono text-xs font-bold text-zinc-900 dark:text-white tabular-data">
                  {traceOpts.colors}
                </span>
              </div>
            </div>

            {/* Resolusi */}
            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ruler className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Resolusi Trace</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Ketajaman detail</p>
                </div>
              </div>
              <select
                value={traceOpts.resolution}
                onChange={(e) =>
                  setTraceOpts((prev) => ({ ...prev, resolution: parseInt(e.target.value, 10) }))
                }
                className="bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value={480}>480 px (Cepat)</option>
                <option value={640}>640 px</option>
                <option value={800}>800 px</option>
                <option value={1000}>1000 px (Akurat)</option>
                <option value={1200}>1200 px (HD)</option>
                <option value={1600}>1600 px (Ultra)</option>
              </select>
            </div>

            {/* Buang Noise */}
            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Eraser className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Filter Noise</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">0 = simpan semua detail</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={traceOpts.speckle}
                  onChange={(e) =>
                    setTraceOpts((prev) => ({ ...prev, speckle: parseInt(e.target.value, 10) }))
                  }
                  className="w-20 accent-amber-500 cursor-pointer"
                />
                <span className="w-6 text-right font-mono text-xs font-bold text-zinc-900 dark:text-white tabular-data">
                  {traceOpts.speckle}
                </span>
              </div>
            </div>

            {/* Kehalusan */}
            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Spline className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Kehalusan Kontur</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Kurva Bezier presisi</p>
                </div>
              </div>
              <select
                value={traceOpts.smoothness}
                onChange={(e) =>
                  setTraceOpts((prev) => ({ ...prev, smoothness: parseInt(e.target.value, 10) }))
                }
                className="bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value={0}>0 - Presisi Tajam</option>
                <option value={1}>1 - Halus Akurat</option>
                <option value={2}>2 - Sangat Halus</option>
              </select>
            </div>
          </div>

          {/* Extra Accuracy Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Hapus Background Terluar
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Otomatis transparan tanpa kotak latar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTraceOpts((prev) => ({ ...prev, removeBg: !prev.removeBg }))}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  traceOpts.removeBg ? "bg-amber-500" : "bg-zinc-300 dark:bg-white/20"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    traceOpts.removeBg ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Bersihkan Tepian Anti-Alias
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Hilangkan warna transisi buram di pinggir
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTraceOpts((prev) => ({ ...prev, cleanEdges: !prev.cleanEdges }))}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                  traceOpts.cleanEdges ? "bg-amber-500" : "bg-zinc-300 dark:bg-white/20"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    traceOpts.cleanEdges ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Extracted Color Palette Swatches */}
          {extractedPalette.length > 0 && (
            <div className="bg-white dark:bg-[#1c1c21] p-3.5 rounded-xl border border-zinc-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Palet Warna Terekstrak ({extractedPalette.length} warna)
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {exactPaletteUsed ? "100% Exact Hex Match" : "Perceptual Snap Active"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extractedPalette.map((hex, i) => (
                  <button
                    key={`${hex}-${i}`}
                    type="button"
                    onClick={() => handleCopyColor(hex)}
                    title={`Salin ${hex.toUpperCase()}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-[#141418] border border-zinc-200 dark:border-white/10 hover:border-amber-500/60 transition cursor-pointer"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded border border-black/15 dark:border-white/20 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                      {hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Alight Motion XML Settings */}
      {activeTab === "alight" && (
        <div className="space-y-4 bg-zinc-50 dark:bg-[#141418] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xs">
          {/* Preset Rasio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-900 dark:text-white">
              Preset Rasio Proyek Alight Motion:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(["orig", "1:1", "16:9", "9:16", "4:5", "4:3"] as const).map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setAlightOpts((prev) => ({ ...prev, preset: pr }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    alightOpts.preset === pr
                      ? "bg-amber-500 text-black border-transparent shadow-xs"
                      : "bg-white dark:bg-[#1c1c21] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10"
                  }`}
                >
                  {pr === "orig" ? "Asli" : pr}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">Durasi</span>
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
                  className="w-14 bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-right text-zinc-900 dark:text-white"
                />
                <span className="text-xs text-zinc-500">s</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1c1c21] p-3 rounded-xl border border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">FPS</span>
              </div>
              <select
                value={alightOpts.fps}
                onChange={(e) =>
                  setAlightOpts((prev) => ({ ...prev, fps: parseInt(e.target.value, 10) }))
                }
                className="bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:text-white"
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
            <label className="text-xs font-bold text-zinc-900 dark:text-white">
              Struktur Export Alight Motion:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlightOpts((prev) => ({ ...prev, grouping: "nested" }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  alightOpts.grouping === "nested"
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                    : "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white"
                }`}
              >
                <p className="text-xs font-bold">Nested (embedScene)</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Satu grup rapi di timeline
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAlightOpts((prev) => ({ ...prev, grouping: "flat" }))}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  alightOpts.grouping === "flat"
                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold"
                    : "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white"
                }`}
              >
                <p className="text-xs font-bold">Flat (Langsung)</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Semua shape di root layer
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Layer List & Filtering */}
      {activeTab === "layers" && (
        <div className="space-y-4 bg-zinc-50 dark:bg-[#141418] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Daftar Layer ({selectedCount}/{totalLayersCount})
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSelectAllLayers(true)}
                className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-white/10 hover:bg-zinc-300/70 text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer"
              >
                Semua
              </button>
              <button
                onClick={() => handleSelectAllLayers(false)}
                className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-white/10 hover:bg-zinc-300/70 text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer"
              >
                Kosong
              </button>
              <button
                onClick={handleInvertLayers}
                className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-white/10 hover:bg-zinc-300/70 text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer"
              >
                Balik
              </button>
            </div>
          </div>

          {activeLayers.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
              Belum ada layer yang diproses.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {activeLayers.map((layer) => {
                const isSelected = selectedLayerIds.has(layer.i);
                return (
                  <div
                    key={layer.i}
                    onClick={() => toggleLayer(layer.i)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white dark:bg-[#1c1c21] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white shadow-2xs"
                        : "bg-zinc-100/50 dark:bg-white/5 border-transparent text-zinc-400 opacity-55"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-amber-500 border-transparent text-black"
                            : "border-zinc-300 dark:border-white/20 bg-transparent"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {layer.color && (
                        <div
                          className="w-4 h-4 rounded-md shadow-inner border border-black/15 dark:border-white/20 shrink-0"
                          style={{ backgroundColor: layer.color }}
                        />
                      )}

                      <span className="text-xs font-mono font-medium">{layer.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-data">
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

      {/* SVG & Vector Preview Card with Compare Slider */}
      {currentSvg && (
        <div className="space-y-4 bg-zinc-50 dark:bg-[#141418] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-white/10">
            {/* Background Selector */}
            <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setBgPattern("grid")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  bgPattern === "grid"
                    ? "bg-white dark:bg-[#242429] text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Latar Transparan / Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBgPattern("dark")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  bgPattern === "dark"
                    ? "bg-white dark:bg-[#242429] text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Latar Hitam"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBgPattern("white")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  bgPattern === "white"
                    ? "bg-white dark:bg-[#242429] text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Latar Putih"
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>

            {/* Compare View Toggle (SVG / Bandingkan / Asli) */}
            {imagePreviewUrl && (
              <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-white/5 p-1 rounded-xl text-[11px] font-semibold">
                <button
                  onClick={() => setPreviewMode("svg")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    previewMode === "svg"
                      ? "bg-white dark:bg-[#242429] text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Shapes className="w-3.5 h-3.5" /> SVG
                </button>
                <button
                  onClick={() => setPreviewMode("compare")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    previewMode === "compare"
                      ? "bg-white dark:bg-[#242429] text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <SplitSquareHorizontal className="w-3.5 h-3.5" /> Bandingkan
                </button>
                <button
                  onClick={() => setPreviewMode("original")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    previewMode === "original"
                      ? "bg-white dark:bg-[#242429] text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Asli
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-white tabular-data cursor-pointer"
                title="Pas Layar (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            className={`relative w-full max-w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 flex items-center justify-center p-4 transition-colors select-none ${
              bgPattern === "grid"
                ? "bg-[conic-gradient(#e2e8f0_25%,#ffffff_0_50%,#e2e8f0_0_75%,#ffffff_0)] dark:bg-[conic-gradient(#262626_25%,#171717_0_50%,#262626_0_75%,#171717_0)] bg-[size:16px_16px]"
                : bgPattern === "dark"
                ? "bg-neutral-950"
                : "bg-white"
            }`}
          >
            {previewMode === "original" && imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Gambar Asli"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-full max-h-full object-contain"
              />
            ) : previewMode === "compare" && imagePreviewUrl ? (
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* Bottom layer: Vector SVG */}
                <div
                  className="absolute inset-0 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: currentSvg }}
                />
                {/* Top layer: Original Raster Image clipped to compareSlider% */}
                <div
                  style={{ clipPath: `inset(0 ${100 - compareSlider}% 0 0)` }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <img
                    src={imagePreviewUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {/* Divider Handle */}
                <div
                  style={{ left: `${compareSlider}%` }}
                  className="absolute inset-y-0 w-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] pointer-events-none"
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-bold shadow">
                    ASLI | SVG
                  </div>
                </div>
                {/* Interactive Range Overlay */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={compareSlider}
                  onChange={(e) => setCompareSlider(Number(e.target.value))}
                  aria-label="Geser Perbandingan Asli dan SVG"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="m-auto flex items-center justify-center w-full h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentSvg }}
              />
            )}
          </div>

          {/* Stats Bar */}
          {alightResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white dark:bg-[#1c1c21] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Layer Aktif
                </p>
                <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white mt-0.5 tabular-data">
                  {selectedCount} / {totalLayersCount}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1c1c21] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Palet Warna
                </p>
                <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white mt-0.5 tabular-data">
                  {extractedPalette.length || alightResult.stats.colors}
                </p>
              </div>
              <div className="bg-white dark:bg-[#1c1c21] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Ukuran SVG
                </p>
                <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white mt-0.5 tabular-data">
                  {(new Blob([currentSvg]).size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="bg-white dark:bg-[#1c1c21] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Kanvas XML
                </p>
                <p className="text-sm font-mono font-bold text-zinc-900 dark:text-white mt-0.5 tabular-data">
                  {alightResult.canvas.w}×{alightResult.canvas.h}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Action Buttons Grid */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadSvg}
            disabled={!currentSvg}
            className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas SVG</span>
          </button>

          <button
            onClick={handleCopySvg}
            disabled={!currentSvg}
            className="flex items-center justify-center gap-2 min-h-[46px] px-4 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-900 dark:text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-200 dark:border-white/10 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Salin Kode SVG</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadAlightXml}
            disabled={!alightResult?.xml}
            className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c21] hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Alight XML</span>
          </button>

          <button
            onClick={handleCopyAlightXml}
            disabled={!alightResult?.xml}
            className="flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl bg-white dark:bg-[#1c1c21] hover:bg-zinc-100 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin XML Alight</span>
          </button>
        </div>

        {alightResult?.xml && (
          <button
            onClick={() => setIsXmlModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            <span>
              Lihat Isi XML Proyek Lengkap ({((alightResult.xmlBytes || 0) / 1024).toFixed(1)} KB)
            </span>
          </button>
        )}
      </div>

      {/* XML Full Inspector Modal */}
      {isXmlModalOpen && alightResult?.xml && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-4">
          <div className="bg-white dark:bg-[#1c1c21] rounded-2xl p-4 flex flex-col h-full max-h-[90vh] max-w-2xl mx-auto w-full shadow-2xl border border-zinc-200 dark:border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  XML Proyek Alight Motion
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAlightXml}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs cursor-pointer"
                >
                  Salin
                </button>
                <button
                  onClick={() => setIsXmlModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={alightResult.xml}
              className="flex-1 mt-3 bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs font-mono text-zinc-900 dark:text-white resize-none focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold ${
                toast.type === "ok"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "bg-rose-600 text-white"
              }`}
            >
              {toast.type === "ok" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-rose-200" />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
