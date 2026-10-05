import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  TraceOptions,
  TraceResult,
  TraceLayerInfo,
  loadAndScaleImage,
  runAutoTrace,
} from "../../services/tracerEngine";
import {
  Wand2,
  Image as ImageIcon,
  Palette,
  Ruler,
  Eraser,
  Spline,
  Shapes,
  Droplets,
  Eye,
  Layers,
  Download,
  Copy,
  Check,
  RotateCcw,
  CheckSquare,
  Square,
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
} from "lucide-react";

export const AutoTraceTool: React.FC = () => {
  // Input Image & State
  const [sourceImage, setSourceImage] = useState<File | string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("image");

  // Trace Options
  const [options, setOptions] = useState<TraceOptions>({
    colors: 8,
    resolution: 640,
    speckle: 6,
    smoothness: 1,
    splitPerPatch: true,
    cleanEdges: true,
    removeBg: false,
  });

  // Processing & Results
  const [status, setStatus] = useState<"idle" | "tracing" | "done" | "error">("idle");
  const [statusText, setStatusText] = useState<string>("MENUNGGU");
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [layers, setLayers] = useState<TraceLayerInfo[]>([]);

  // Preview & Viewport State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [bgPattern, setBgPattern] = useState<"grid" | "dark" | "white">("grid");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "bad" } | null>(null);

  // Cancellation and Debounce Ref
  const abortControllerRef = useRef<{ aborted: boolean }>({ aborted: false });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: "ok" | "bad" = "ok") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 2600);
  };

  /**
   * Main Execute Trace Function
   */
  const executeTrace = useCallback(
    async (src: File | string, currentOpts: TraceOptions) => {
      // Abort ongoing task
      abortControllerRef.current.aborted = true;
      const newAbortSignal = { aborted: false };
      abortControllerRef.current = newAbortSignal;

      setStatus("tracing");
      setStatusText("MEMUAT GAMBAR...");
      setProgress(0.05);
      setErrorMsg(null);

      try {
        const { imageData } = await loadAndScaleImage(src, currentOpts.resolution);
        if (newAbortSignal.aborted) return;

        const result = await runAutoTrace(
          imageData,
          currentOpts,
          (pct, text) => {
            if (!newAbortSignal.aborted) {
              setProgress(pct);
              setStatusText(text);
            }
          },
          newAbortSignal
        );

        if (newAbortSignal.aborted) return;

        setTraceResult(result);
        setLayers(result.layers);
        setStatus("done");
        setStatusText("SELESAI");
        setProgress(1);
      } catch (err: any) {
        if (!newAbortSignal.aborted) {
          console.error("Trace failed:", err);
          setStatus("error");
          setStatusText("ERROR");
          const msg = err?.message || "Gagal melakukan trace pada gambar.";
          setErrorMsg(msg);
          showToast(msg, "bad");
        }
      }
    },
    []
  );

  /**
   * Debounced Auto-Retrace on Settings Change (450ms)
   */
  useEffect(() => {
    if (!sourceImage) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTrace(sourceImage, options);
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [options, sourceImage, executeTrace]);

  /**
   * Handle File Selection
   */
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
      showToast("Pilih file gambar yang valid (PNG, JPG, WebP)", "bad");
      return;
    }

    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const objUrl = URL.createObjectURL(file);
    setSourceImage(file);
    setImagePreviewUrl(objUrl);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setImageFileName(cleanName);
    setZoomLevel(1);
    executeTrace(file, options);
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
   * Toggle Layer Visibility
   */
  const toggleLayer = (layerId: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleSelectAllLayers = (selectAll: boolean) => {
    setLayers((prev) => prev.map((l) => ({ ...l, enabled: selectAll })));
  };

  const handleInvertLayers = () => {
    setLayers((prev) => prev.map((l) => ({ ...l, enabled: !l.enabled })));
  };

  /**
   * Generate Live SVG from current enabled layers
   */
  const liveSvgString = React.useMemo(() => {
    if (!traceResult) return "";
    const activePaths = layers
      .filter((l) => l.enabled)
      .map((l) => `<path fill="${l.hex}" d="${l.d}"/>`)
      .join("\n");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${traceResult.width}" height="${traceResult.height}" viewBox="0 0 ${traceResult.width} ${traceResult.height}">\n${activePaths}\n</svg>`;
  }, [traceResult, layers]);

  /**
   * Copy SVG to Clipboard
   */
  const handleCopySvg = async () => {
    if (!liveSvgString) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(liveSvgString);
      } else {
        const ta = document.createElement("textarea");
        ta.value = liveSvgString;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("Kode SVG berhasil disalin", "ok");
    } catch {
      showToast("Gagal menyalin SVG ke clipboard", "bad");
    }
  };

  /**
   * Download SVG File
   */
  const handleDownloadSvg = () => {
    if (!liveSvgString) return;
    const blob = new Blob([liveSvgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageFileName}-trace.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("SVG siap diunduh", "ok");
  };

  /**
   * Reset All
   */
  const handleReset = () => {
    abortControllerRef.current.aborted = true;
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSourceImage(null);
    setImagePreviewUrl("");
    setTraceResult(null);
    setLayers([]);
    setStatus("idle");
    setStatusText("MENUNGGU");
    setProgress(0);
    setErrorMsg(null);
  };

  const activeLayersCount = layers.filter((l) => l.enabled).length;
  const currentSvgBytes = liveSvgString ? new Blob([liveSvgString]).size : 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 font-sans text-neutral-100 pb-12 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
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
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Auto Trace SVG
            </h1>
            <p className="text-[10px] font-mono text-neutral-400">v2.0 • Split per Patch</p>
          </div>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all ${
            status === "tracing"
              ? "bg-neutral-800 text-neutral-200 border border-neutral-700 animate-pulse"
              : status === "done"
              ? "bg-white text-neutral-950 shadow-md font-semibold"
              : status === "error"
              ? "bg-red-950/40 text-red-400 border border-dashed border-red-800/60"
              : "bg-neutral-900 text-neutral-400 border border-neutral-800"
          }`}
        >
          {status === "tracing" ? (
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

      {/* Upload Zone (or Image Loaded Mini Card) */}
      {!sourceImage ? (
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
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-white bg-neutral-900/60 shadow-lg"
              : "border-neutral-800 hover:border-neutral-600 bg-gradient-to-b from-neutral-900/60 to-neutral-950"
          }`}
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-b from-white to-neutral-300 flex items-center justify-center text-neutral-950 shadow-md">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">Pilih atau Seret Gambar</h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            PNG, JPG, WebP • Diproses 100% di browser HP/Laptop tanpa upload ke server.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
            <span>Bisa Ctrl + V / Paste Clipboard</span>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Source"
                className="w-10 h-10 object-cover rounded-lg border border-neutral-700 shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{imageFileName}</p>
              <p className="text-[11px] font-mono text-neutral-400">
                {traceResult ? `${traceResult.width} × ${traceResult.height} px` : "Memuat..."}
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
              title="Hapus gambar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Settings Card */}
      <section className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800/90 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-200">
              <Wand2 className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Pengaturan Trace</h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide">
            Auto Debounce
          </span>
        </div>

        {/* Row 1: Jumlah Warna */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-neutral-200">Jumlah Warna</p>
              <p className="text-[10px] text-neutral-400">Palet K-Means (2 - 24)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={2}
              max={24}
              value={options.colors}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, colors: parseInt(e.target.value, 10) }))
              }
              className="w-20 accent-white cursor-pointer"
            />
            <span className="w-7 text-right font-mono text-xs font-bold text-white">
              {options.colors}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-800/40" />

        {/* Row 2: Detail / Resolusi */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-neutral-200">Detail (Resolusi)</p>
              <p className="text-[10px] text-neutral-400">Sisi terpanjang raster</p>
            </div>
          </div>
          <select
            value={options.resolution}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, resolution: parseInt(e.target.value, 10) }))
            }
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-white"
          >
            <option value={320}>320 px (Cepat)</option>
            <option value={480}>480 px (Sedang)</option>
            <option value={640}>640 px (Standar)</option>
            <option value={800}>800 px (Detail HD)</option>
          </select>
        </div>

        <div className="border-t border-neutral-800/40" />

        {/* Row 3: Buang Noise (Speckle) */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Eraser className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-neutral-200">Buang Noise</p>
              <p className="text-[10px] text-neutral-400">Filter luas patch kecil</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={60}
              value={options.speckle}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, speckle: parseInt(e.target.value, 10) }))
              }
              className="w-20 accent-white cursor-pointer"
            />
            <span className="w-7 text-right font-mono text-xs font-bold text-white">
              {options.speckle}
            </span>
          </div>
        </div>

        <div className="border-t border-neutral-800/40" />

        {/* Row 4: Kehalusan Kontur */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Spline className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-neutral-200">Kehalusan Kontur</p>
              <p className="text-[10px] text-neutral-400">Catmull-Rom & Bezier</p>
            </div>
          </div>
          <select
            value={options.smoothness}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, smoothness: parseInt(e.target.value, 10) }))
            }
            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-white"
          >
            <option value={0}>0 - Tajam (Poligon)</option>
            <option value={1}>1 - Halus (Standar)</option>
            <option value={2}>2 - Sangat Halus</option>
          </select>
        </div>

        <div className="border-t border-neutral-800/40" />

        {/* Row 5: Switches (Split per patch, Rapikan tepi, Buang Latar) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Switch 1: Pisah per Patch */}
          <button
            type="button"
            onClick={() =>
              setOptions((prev) => ({ ...prev, splitPerPatch: !prev.splitPerPatch }))
            }
            className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
              options.splitPerPatch
                ? "bg-neutral-800 border-white text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-400"
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold">Pisah Patch</p>
              <p className="text-[9px] text-neutral-400">1 path per patch</p>
            </div>
            <div
              className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                options.splitPerPatch ? "bg-white" : "bg-neutral-700"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-transform ${
                  options.splitPerPatch
                    ? "translate-x-3 bg-neutral-950"
                    : "translate-x-0 bg-neutral-400"
                }`}
              />
            </div>
          </button>

          {/* Switch 2: Rapikan Tepi */}
          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, cleanEdges: !prev.cleanEdges }))}
            className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
              options.cleanEdges
                ? "bg-neutral-800 border-white text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-400"
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold">Rapikan Tepi</p>
              <p className="text-[9px] text-neutral-400">Hapus anti-alias fringe</p>
            </div>
            <div
              className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                options.cleanEdges ? "bg-white" : "bg-neutral-700"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-transform ${
                  options.cleanEdges
                    ? "translate-x-3 bg-neutral-950"
                    : "translate-x-0 bg-neutral-400"
                }`}
              />
            </div>
          </button>

          {/* Switch 3: Buang Latar */}
          <button
            type="button"
            onClick={() => setOptions((prev) => ({ ...prev, removeBg: !prev.removeBg }))}
            className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
              options.removeBg
                ? "bg-neutral-800 border-white text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-400"
            }`}
          >
            <div>
              <p className="text-[11px] font-semibold">Buang Latar</p>
              <p className="text-[9px] text-neutral-400">Transparansi kanvas</p>
            </div>
            <div
              className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
                options.removeBg ? "bg-white" : "bg-neutral-700"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-transform ${
                  options.removeBg
                    ? "translate-x-3 bg-neutral-950"
                    : "translate-x-0 bg-neutral-400"
                }`}
              />
            </div>
          </button>
        </div>
      </section>

      {/* SVG Preview Card */}
      {traceResult && (
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
            {liveSvgString ? (
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="m-auto flex items-center justify-center max-w-full max-h-full"
                dangerouslySetInnerHTML={{ __html: liveSvgString }}
              />
            ) : (
              <p className="text-xs text-neutral-400">Memuat pratinjau SVG...</p>
            )}
          </div>

          {/* Stats Bar (2 Columns / 4 Cells) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
              <p className="text-[10px] font-mono text-neutral-400 uppercase">Jumlah Shape</p>
              <p className="text-sm font-mono font-bold text-white">{activeLayersCount}</p>
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
              <p className="text-[10px] font-mono text-neutral-400 uppercase">Jumlah Warna</p>
              <p className="text-sm font-mono font-bold text-white">{traceResult.totalColors}</p>
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
              <p className="text-[10px] font-mono text-neutral-400 uppercase">Ukuran Berkas</p>
              <p className="text-sm font-mono font-bold text-white">
                {(currentSvgBytes / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2.5">
              <p className="text-[10px] font-mono text-neutral-400 uppercase">Dimensi SVG</p>
              <p className="text-sm font-mono font-bold text-white">
                {traceResult.width}×{traceResult.height}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Layer List Card */}
      {layers.length > 0 && (
        <section className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-neutral-800/90 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-300" />
              <h3 className="text-sm font-semibold text-white">
                Daftar Layer / Path ({activeLayersCount}/{layers.length})
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
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                  layer.enabled
                    ? "bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-white"
                    : "bg-neutral-950/60 border-neutral-900/80 text-neutral-400 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      layer.enabled
                        ? "bg-white border-white text-neutral-950"
                        : "border-neutral-600 bg-transparent"
                    }`}
                  >
                    {layer.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div
                    className="w-4 h-4 rounded shadow-inner border border-white/20"
                    style={{ backgroundColor: layer.hex }}
                  />

                  <span className="text-xs font-mono font-medium">{layer.name}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                  <span>{layer.pointsCount} pts</span>
                  <span className="text-[10px] uppercase">{layer.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleCopySvg}
          disabled={!liveSvgString}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 border border-neutral-700 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <Copy className="w-4 h-4" />
          <span>Salin Kode SVG</span>
        </button>

        <button
          onClick={handleDownloadSvg}
          disabled={!liveSvgString}
          className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-gradient-to-b from-white to-neutral-200 hover:from-neutral-100 hover:to-neutral-300 text-neutral-950 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/10"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Berkas SVG</span>
        </button>

        <a
          href="/auto-trace.html"
          target="_blank"
          rel="noreferrer"
          className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Buka / Unduh Versi Standalone Single-File (index.html)</span>
        </a>
      </div>

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
