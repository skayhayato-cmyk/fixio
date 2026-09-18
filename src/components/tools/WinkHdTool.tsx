import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCw, Wand2, CheckCircle2 } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { BeforeAfterSlider } from "../BeforeAfterSlider";
import { enhanceWinkHd } from "../../services/nexaDevApi";

export const WinkHdTool: React.FC = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [originalLocalPreview, setOriginalLocalPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedDataUrl, setEnhancedDataUrl] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  // Clean up object URLs on unmount or new run
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (currentObjectUrlRef.current && currentObjectUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);

  const handleEnhance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageUrl) {
      setError("Silakan pilih atau unggah gambar terlebih dahulu.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);
    setIsLoading(true);

    if (currentObjectUrlRef.current && currentObjectUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
    setEnhancedDataUrl(null);

    try {
      const result = await enhanceWinkHd(imageUrl, abortControllerRef.current.signal);
      currentObjectUrlRef.current = result.objectUrl;
      setEnhancedDataUrl(result.objectUrl);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.message === "Permintaan dibatalkan.") {
        return;
      }
      setError(err.message || "Terjadi kesalahan saat memproses peningkatan resolusi gambar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Sparkles className="w-4 h-4" />
          <span>AI Image Upscaler & Converter HD</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Wink HD Quality Enhancer
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Tingkatkan ketajaman, perjelas detail wajah & objek foto blur secara instan menggunakan AI.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <ImageUploaderZone
          label="Pilih Foto yang Ingin Di-HD-kan"
          helperText="Drag & drop foto blur/resolusi rendah Anda di sini"
          value={imageUrl}
          onChange={setImageUrl}
          onOriginalFileUrl={setOriginalLocalPreview}
          required
        />

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleEnhance()}
            disabled={!imageUrl || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses & Mengonversi AI HD...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Tingkatkan Resolusi (HD)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Proses Gagal</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result Section */}
      {enhancedDataUrl && (
        <div className="space-y-4 pt-2 animate-ios-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hasil Foto HD Berhasil Dikonversi
              </h3>
              <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-0.5">
                Geser slider di bawah untuk melihat perbandingan ketajaman sebelum dan sesudah diproses.
              </p>
            </div>

            <button
              onClick={() => handleEnhance()}
              className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Proses Ulang
            </button>
          </div>

          <BeforeAfterSlider
            beforeUrl={originalLocalPreview || imageUrl}
            afterUrl={enhancedDataUrl}
            beforeLabel="Sebelum (Original)"
            afterLabel="Sesudah (Wink HD)"
            filenamePrefix="fixio_wink_hd"
          />
        </div>
      )}
    </div>
  );
};
