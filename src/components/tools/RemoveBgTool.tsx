import React, { useState } from "react";
import { Scissors, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { BeforeAfterSlider } from "../BeforeAfterSlider";
import { getProxiedImageUrl } from "../../services/api";

export const RemoveBgTool: React.FC = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [originalLocalPreview, setOriginalLocalPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  const handleRemoveBg = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageUrl) {
      setError("Silakan pilih atau unggah gambar terlebih dahulu.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setProcessedUrl(null);

    try {
      const rawApiUrl = `https://api.nexadev.my.id/tools/remove/?url=${encodeURIComponent(imageUrl)}`;
      const proxyUrl = getProxiedImageUrl(rawApiUrl);

      const img = new Image();
      img.onload = () => {
        setProcessedUrl(rawApiUrl);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError("Gagal menghapus latar belakang gambar. Pastikan gambar jelas.");
        setIsLoading(false);
      };
      img.src = proxyUrl;
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses gambar.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Scissors className="w-4 h-4" />
          <span>AI Background Eraser</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Hapus Latar Belakang Foto
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Hapus background foto secara otomatis dan rapi dengan presisi tinggi. Hasil transparan siap unduh dalam format PNG.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <ImageUploaderZone
          label="Pilih Foto yang Ingin Dihapus Background-nya"
          helperText="Drag & drop foto produk, orang, atau objek di sini"
          value={imageUrl}
          onChange={setImageUrl}
          onOriginalFileUrl={setOriginalLocalPreview}
          required
        />

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleRemoveBg()}
            disabled={!imageUrl || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus Background...</span>
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                <span>Hapus Background Sekarang</span>
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
            <p className="font-semibold">Gagal Menghapus Background</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result Section */}
      {processedUrl && (
        <div className="space-y-4 pt-2 animate-ios-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Background Berhasil Dihapus Transparan
              </h3>
              <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-0.5">
                Geser slider di bawah untuk melihat perbedaan foto sebelum dan sesudah dipotong.
              </p>
            </div>

            <button
              onClick={() => handleRemoveBg()}
              className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Proses Ulang
            </button>
          </div>

          <BeforeAfterSlider
            beforeUrl={originalLocalPreview || imageUrl}
            afterUrl={getProxiedImageUrl(processedUrl)}
            beforeLabel="Original Foto"
            afterLabel="Tanpa Background"
            transparentBackground={true}
            filenamePrefix="fixio_removebg"
          />
        </div>
      )}
    </div>
  );
};
