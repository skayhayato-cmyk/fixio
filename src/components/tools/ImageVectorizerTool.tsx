import React, { useState, useRef, useEffect } from "react";
import {
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  Sliders,
  Image as ImageIcon,
  FileType,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileCode,
  Palette,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import {
  vectorizeImage,
  VectorizerOptions,
  DEFAULT_VECTORIZER_OPTIONS,
  VECTORIZER_PRESETS,
  VectorizerPresetKey,
  VectorizeResult,
} from "../../services/imageVectorizer";

interface ImageVectorizerToolProps {
  onSelectTool?: (toolId: string) => void;
}

export const ImageVectorizerTool: React.FC<ImageVectorizerToolProps> = ({ onSelectTool }) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VectorizeResult | null>(null);
  
  // Customization controls
  const [options, setOptions] = useState<VectorizerOptions>(DEFAULT_VECTORIZER_OPTIONS);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [activeCopiedKey, setActiveCopiedKey] = useState<string | null>(null);

  // Preview Mode
  const [viewMode, setViewMode] = useState<"side-by-side" | "svg-only" | "original-only">("side-by-side");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);
  const [codeTab, setCodeTab] = useState<"preview" | "code">("preview");

  const sampleUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";

  // Trigger vectorization when button is clicked or options change
  const handleVectorize = async (optsToUse: VectorizerOptions = options) => {
    if (!imageUrl) {
      setError("Silakan pilih atau unggah gambar terlebih dahulu.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const activeImg = localPreviewUrl || imageUrl;
      const res = await vectorizeImage(activeImg, optsToUse);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Gagal mengonversi gambar menjadi vektor SVG.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (key: VectorizerPresetKey) => {
    const preset = VECTORIZER_PRESETS.find((p) => p.id === key);
    if (preset) {
      const newOpts: VectorizerOptions = {
        ...options,
        ...preset.options,
        preset: key,
      };
      setOptions(newOpts);
      if (imageUrl) {
        handleVectorize(newOpts);
      }
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setActiveCopiedKey(key);
    setTimeout(() => setActiveCopiedKey(null), 2000);
  };

  const handleDownloadSvg = () => {
    if (!result) return;
    const blob = new Blob([result.svgCode], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fixio-vectorized-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Layers className="w-4 h-4" />
          <span>Auto Trace & Raster to Vector</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Image Vectorizer
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Ubah gambar bitmap (PNG, JPG, WebP) menjadi berkas vektor SVG yang scalable tanpa blur/pecah saat diperbesar. Siap dipakai di Figma, Illustrator, atau desain cetak.
        </p>
      </div>

      {/* Upload Zone & Sample Picker */}
      <div className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#007aff]" />
            <span>Pilih Gambar yang Ingin Di-Trace</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setImageUrl(sampleUrl);
              setLocalPreviewUrl(sampleUrl);
              setResult(null);
            }}
            className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" /> Gunakan Contoh Ilustrasi
          </button>
        </div>

        <ImageUploaderZone
          label=""
          helperText="Format didukung: PNG, JPG, WebP, GIF. Disarankan gambar dengan kontras jelas."
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (!url) {
              setResult(null);
              setError(null);
            }
          }}
          onOriginalFileUrl={(localUrl) => {
            setLocalPreviewUrl(localUrl);
          }}
          required
        />

        {/* Preset Selection Row */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#007aff]" />
              <span>Preset Mode Auto Trace</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvancedOptions ? "Sembunyikan Pengaturan Detail" : "Pengaturan Detail Tracing"}</span>
              {showAdvancedOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {VECTORIZER_PRESETS.map((preset) => {
              const isSelected = options.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#007aff]/10 border-[#007aff] text-[#007aff] dark:text-[#0a84ff] font-bold shadow-xs"
                      : "bg-white dark:bg-[#1c1c1e] border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-black/20 dark:hover:border-white/20"
                  }`}
                >
                  <span className="text-xs truncate font-semibold">{preset.name}</span>
                  <span className="text-[10px] opacity-70 line-clamp-1 mt-1 font-normal">
                    {preset.options.numberOfColors ? `${preset.options.numberOfColors} Warna` : "Setting"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expandable Advanced Controls */}
        {showAdvancedOptions && (
          <div className="p-4 bg-white dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 space-y-4 text-xs animate-ios-fade">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#007aff]" /> Kustomisasi Algoritma Tracing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Number of Colors */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Jumlah Warna Palette:</span>
                  <span className="font-bold text-[#007aff]">{options.monochrome ? "2 (Hitam-Putih)" : options.numberOfColors}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="64"
                  step="2"
                  disabled={options.monochrome}
                  value={options.numberOfColors}
                  onChange={(e) => setOptions({ ...options, numberOfColors: parseInt(e.target.value) })}
                  className="w-full accent-[#007aff] cursor-pointer"
                />
              </div>

              {/* Path Omit (Noise Filter) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Filter Bintik & Noise (Speckle):</span>
                  <span className="font-bold text-[#007aff]">{options.pathOmit} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="2"
                  value={options.pathOmit}
                  onChange={(e) => setOptions({ ...options, pathOmit: parseInt(e.target.value) })}
                  className="w-full accent-[#007aff] cursor-pointer"
                />
              </div>

              {/* Blur Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Kehalusan / Blur Awal:</span>
                  <span className="font-bold text-[#007aff]">{options.blurRadius} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={options.blurRadius}
                  onChange={(e) => setOptions({ ...options, blurRadius: parseInt(e.target.value) })}
                  className="w-full accent-[#007aff] cursor-pointer"
                />
              </div>

              {/* Line Threshold */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600 dark:text-slate-400">Toleransi Kurva (Line Fitting):</span>
                  <span className="font-bold text-[#007aff]">{options.lineThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.2"
                  value={options.lineThreshold}
                  onChange={(e) => setOptions({ ...options, lineThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-[#007aff] cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2 pt-1 justify-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.monochrome}
                    onChange={(e) => setOptions({ ...options, monochrome: e.target.checked })}
                    className="rounded accent-[#007aff] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Mode Stencil / Monokrom (2 Warna)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.removeBackground}
                    onChange={(e) => setOptions({ ...options, removeBackground: e.target.checked })}
                    className="rounded accent-[#007aff] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Hapus Warna Background Putih</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Submit Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleVectorize()}
            disabled={!imageUrl || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#007aff] hover:bg-[#0062cc] active:scale-95 text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Vector Tracing SVG...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Trasing Gambar ke Vektor SVG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Proses Tracing Gagal</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Vectorization Result Section */}
      {result && (
        <div className="space-y-5 pt-2 animate-ios-fade">
          {/* Output Header & Quick Metrics */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Hasil Vektor SVG Selesai</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {result.pathCount} Kurva Bezier Path • {result.colorsUsed} Warna • {formatFileSize(result.fileSizeBytes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File SVG</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(result.svgCode, "svg-code")}
                className="px-3.5 py-2 bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-black dark:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-black/5 dark:border-white/10"
              >
                {activeCopiedKey === "svg-code" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Kode SVG Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Kode SVG</span>
                  </>
                )}
              </button>

              {onSelectTool && (
                <button
                  type="button"
                  onClick={() => onSelectTool("svg-to-xml")}
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-indigo-200 dark:border-indigo-800"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Konversi ke Android XML</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleVectorize()}
                className="p-2 text-slate-500 hover:text-[#007aff] rounded-xl cursor-pointer"
                title="Trasing Ulang"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Viewer Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-slate-100 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 text-xs font-medium">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] p-1 rounded-lg border border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "side-by-side"
                    ? "bg-[#007aff] text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                Side by Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode("svg-only")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "svg-only"
                    ? "bg-[#007aff] text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                Vektor SVG Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode("original-only")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "original-only"
                    ? "bg-[#007aff] text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-black"
                }`}
              >
                Gambar Asli
              </button>
            </div>

            {/* Code vs Visual Tab */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] p-1 rounded-lg border border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setCodeTab("preview")}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  codeTab === "preview"
                    ? "bg-[#007aff] text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Pratinjau Visual
              </button>
              <button
                type="button"
                onClick={() => setCodeTab("code")}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  codeTab === "code"
                    ? "bg-[#007aff] text-white font-semibold"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Kode SVG
              </button>
            </div>

            {/* Zoom & Background Controls */}
            {codeTab === "preview" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckerboard(!showCheckerboard)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    showCheckerboard
                      ? "bg-slate-200 dark:bg-slate-700 text-black dark:text-white border-slate-300"
                      : "bg-white dark:bg-[#2c2c2e] text-slate-500 border-black/5"
                  }`}
                  title="Toggle Background Transparan Checkerboard"
                >
                  <FileType className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] px-2 py-1 rounded-lg border border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                    className="text-slate-600 dark:text-slate-300 hover:text-black cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-bold w-10 text-center">{zoomLevel}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}
                    className="text-slate-600 dark:text-slate-300 hover:text-black cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="text-[10px] text-[#007aff] hover:underline font-semibold ml-1 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Visual Comparison / Code View */}
          {codeTab === "preview" ? (
            <div
              className={`grid gap-4 ${
                viewMode === "side-by-side" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* Original Image View */}
              {(viewMode === "side-by-side" || viewMode === "original-only") && (
                <div className="p-4 bg-slate-50 dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Gambar Bitmap Asli (Raster)</span>
                    <span className="font-mono">{result.originalWidth} × {result.originalHeight} px</span>
                  </div>

                  <div
                    className={`aspect-square w-full rounded-xl border border-black/10 dark:border-white/10 overflow-auto flex items-center justify-center p-2 relative ${
                      showCheckerboard
                        ? "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]"
                        : "bg-white dark:bg-[#121214]"
                    }`}
                  >
                    <img
                      src={localPreviewUrl || imageUrl}
                      alt="Original Raster"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                      className="max-w-full max-h-full object-contain transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* Vectorized SVG View */}
              {(viewMode === "side-by-side" || viewMode === "svg-only") && (
                <div className="p-4 bg-slate-50 dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Hasil Vector SVG Jernih
                    </span>
                    <span className="font-mono">{result.tracedWidth} × {result.tracedHeight} px</span>
                  </div>

                  <div
                    className={`aspect-square w-full rounded-xl border border-black/10 dark:border-white/10 overflow-auto flex items-center justify-center p-2 relative ${
                      showCheckerboard
                        ? "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]"
                        : "bg-white dark:bg-[#121214]"
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: result.svgCode }}
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                      className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200 [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-full [&>svg]:h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SVG Code Tab */
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> Kode Standar SVG ({formatFileSize(result.fileSizeBytes)})
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.svgCode, "code-tab")}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {activeCopiedKey === "code-tab" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{activeCopiedKey === "code-tab" ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={result.svgCode}
                rows={12}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none resize-y"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
