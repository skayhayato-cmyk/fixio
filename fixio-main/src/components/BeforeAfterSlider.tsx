import React, { useState, useRef, useCallback } from "react";
import { Download, Sliders, Columns, Sparkles, Check, ZoomIn, Loader2 } from "lucide-react";
import { triggerDownload } from "../services/api";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  transparentBackground?: boolean;
  filenamePrefix?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUrl,
  afterUrl,
  beforeLabel = "Original",
  afterLabel = "Enhanced Result",
  transparentBackground = false,
  filenamePrefix = "fixio_result",
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<"slider" | "split" | "afterOnly">("slider");
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg">("png");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAfterLoaded, setIsAfterLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current && e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const filename = `${filenamePrefix}_${Date.now()}.${downloadFormat}`;
    await triggerDownload(afterUrl, filename);
    setIsDownloading(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#121214] p-2.5 rounded-2xl border border-black/5 dark:border-white/10 text-xs font-medium transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#8e8e93] dark:text-[#98989d] font-semibold px-2">Tampilan:</span>
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "slider"
                ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-xs border border-black/5 dark:border-white/10 font-semibold"
                : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Slider Interaktif
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "split"
                ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-xs border border-black/5 dark:border-white/10 font-semibold"
                : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Berdampingan (Split)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("afterOnly")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "afterOnly"
                ? "bg-white dark:bg-[#2c2c2e] text-[#007aff] dark:text-[#0a84ff] shadow-xs border border-black/5 dark:border-white/10 font-semibold"
                : "text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Hasil Saja
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDownloadFormat("png")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              downloadFormat === "png"
                ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-xs"
                : "text-[#8e8e93] dark:text-[#aeaeb2]"
            }`}
          >
            PNG (HD)
          </button>
          <button
            type="button"
            onClick={() => setDownloadFormat("jpg")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              downloadFormat === "jpg"
                ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-xs"
                : "text-[#8e8e93] dark:text-[#aeaeb2]"
            }`}
          >
            JPG
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {viewMode === "slider" && (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden shadow-sm border border-black/10 dark:border-white/10 select-none cursor-ew-resize bg-black/5 dark:bg-[#121214]"
        >
          {/* Transparent Grid Pattern if needed */}
          {transparentBackground && (
            <div
              className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            />
          )}

          {/* After (Enhanced) Image Layer (Full base) */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <img
              src={afterUrl}
              alt={afterLabel}
              onLoad={() => setIsAfterLoaded(true)}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Before Image Layer (Clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center p-2"
              style={{
                width: containerRef.current?.clientWidth || "100%",
                height: "100%",
              }}
            >
              <img
                src={beforeUrl}
                alt={beforeLabel}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Draggable Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-xl border border-black/10 flex items-center justify-center pointer-events-auto">
              <Sliders className="w-4 h-4 rotate-90 text-[#007aff]" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide pointer-events-none">
            {beforeLabel}
          </div>
          <div className="absolute bottom-3 right-3 bg-[#007aff]/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide pointer-events-none flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {afterLabel}
          </div>
        </div>
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#8e8e93] dark:text-[#98989d] px-1">{beforeLabel}</span>
            <div className="w-full aspect-4/3 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#121214] p-2 flex items-center justify-center">
              <img src={beforeUrl} alt={beforeLabel} className="max-w-full max-h-full object-contain" />
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#007aff] px-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {afterLabel}
            </span>
            <div className="w-full aspect-4/3 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#121214] p-2 flex items-center justify-center">
              <img src={afterUrl} alt={afterLabel} className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {viewMode === "afterOnly" && (
        <div className="w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#121214] p-2 flex items-center justify-center">
          <img src={afterUrl} alt={afterLabel} className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Download Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="ios-btn-primary px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengunduh...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Hasil ({downloadFormat.toUpperCase()})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
