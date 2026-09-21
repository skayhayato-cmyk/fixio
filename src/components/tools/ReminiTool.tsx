import React, { useState, useEffect, useRef } from "react";
import { Wand2, Loader2, AlertCircle, RefreshCw, CheckCircle2, Download, Copy, Check, ExternalLink, FileImage, HardDrive } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { BeforeAfterSlider } from "../BeforeAfterSlider";
import { enhanceReminiPhoto, ReminiData } from "../../services/nexaDevApi";
import { downloadMedia } from "../../services/api";

export const ReminiTool: React.FC = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [originalLocalPreview, setOriginalLocalPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminiResult, setReminiResult] = useState<{
    objectUrl: string;
    enhancedUrl: string;
    data: ReminiData;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

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
    setReminiResult(null);

    try {
      const result = await enhanceReminiPhoto(imageUrl, abortControllerRef.current.signal);
      currentObjectUrlRef.current = result.objectUrl;
      setReminiResult(result);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.message === "Permintaan dibatalkan.") {
        return;
      }
      setError(err.message || "Terjadi kesalahan saat memproses peningkatan foto Remini AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJpg = () => {
    if (!reminiResult) return;
    const downloadUrl = `/api/proxy-image?url=${encodeURIComponent(reminiResult.enhancedUrl)}&download=true&filename=${
      reminiResult.data.filename || `remini_${Date.now()}.jpg`
    }`;
    downloadMedia(downloadUrl, reminiResult.data.filename || `Fixio_Remini_${Date.now()}.jpg`, "image/jpeg");
  };

  const handleCopyLink = () => {
    if (!reminiResult) return;
    navigator.clipboard.writeText(reminiResult.enhancedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Wand2 className="w-4 h-4" />
          <span>AI Photo Enhancer & Upscaler</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Remini AI Photo Enhancer
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Tingkatkan kejernihan, hilangkan blur, dan pertajam detail foto secara otomatis dengan algoritma Remini AI.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <ImageUploaderZone
          label="Pilih Foto yang Ingin Di-Remini AI"
          helperText="Drag & drop foto blur/resolusi rendah Anda di sini"
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (!url) {
              setReminiResult(null);
              setError(null);
            }
          }}
          onOriginalFileUrl={setOriginalLocalPreview}
          required
        />

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleEnhance()}
            disabled={!imageUrl || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#007aff] hover:bg-[#0062cc] active:scale-95 text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses & Menajamkan Foto dengan Remini AI...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Tingkatkan Foto (Remini AI)</span>
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
            <p className="font-semibold">Proses Remini AI Gagal</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result Section */}
      {reminiResult && (
        <div className="space-y-5 pt-2 animate-ios-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hasil Foto Remini AI Berhasil Ditingkatkan
              </h3>
              <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-0.5">
                Geser slider di bawah untuk membandingkan foto asli dan hasil konversi Remini AI.
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

          {/* Before-After Comparison Slider */}
          <BeforeAfterSlider
            beforeUrl={originalLocalPreview || imageUrl}
            afterUrl={reminiResult.objectUrl}
            beforeLabel="Sebelum (Original)"
            afterLabel="Sesudah (Remini AI HD)"
          />

          {/* Metadata Card & Download Controls */}
          <div className="bg-slate-50 dark:bg-[#1c1c1e] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-[#2c2c2e] rounded-xl border border-black/5 dark:border-white/5">
                <FileImage className="w-4 h-4 text-[#007aff] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Nama File</span>
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate block">
                    {reminiResult.data.filename || "remini_enhanced.jpg"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-[#2c2c2e] rounded-xl border border-black/5 dark:border-white/5">
                <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Ukuran File</span>
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-200 block">
                    {reminiResult.data.size || "HD Quality"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-[#2c2c2e] rounded-xl border border-black/5 dark:border-white/5">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Format Output</span>
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-200 block uppercase">
                    {reminiResult.data.extension || "JPG"} ({reminiResult.data.mime || "image/jpeg"})
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Unduh Foto JPG HD
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-white dark:bg-[#2c2c2e] hover:bg-slate-100 dark:hover:bg-[#3a3a3c] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUrl ? "Tersalin!" : "Salin Link JPG"}</span>
                </button>
              </div>

              <a
                href={reminiResult.enhancedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1"
              >
                <span>Buka Gambar Langsung</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
