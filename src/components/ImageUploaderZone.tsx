import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Link2, Copy, X } from "lucide-react";
import { uploadImageFile } from "../services/api";

interface ImageUploaderZoneProps {
  label?: string;
  helperText?: string;
  value?: string;
  onChange: (url: string) => void;
  onOriginalFileUrl?: (url: string) => void;
  required?: boolean;
}

export const ImageUploaderZone: React.FC<ImageUploaderZoneProps> = ({
  label = "Unggah Gambar",
  helperText = "Drag & drop file gambar atau klik untuk memilih (Maks. 20MB)",
  value = "",
  onChange,
  onOriginalFileUrl,
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState(value);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setInputUrl(value);
  }, [value]);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar (JPG, PNG, WebP, dll)");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const localPreviewUrl = URL.createObjectURL(file);
    if (onOriginalFileUrl) {
      onOriginalFileUrl(localPreviewUrl);
    }

    try {
      const res = await uploadImageFile(file);
      if (res.status && res.path) {
        onChange(res.path);
        setInputUrl(res.path);
      } else {
        setUploadError(res.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      setUploadError(err.message || "Terjadi kesalahan upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        handleProcessFile(file);
      }
    }
  };

  const handleCopyUrl = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    onChange("");
    setInputUrl("");
    if (onOriginalFileUrl) onOriginalFileUrl("");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-2" onPaste={handlePaste}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-black dark:text-white flex items-center gap-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs font-medium text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="w-3.5 h-3.5" />
          {showUrlInput ? "Tutup Mode URL" : "Pakai Direct URL"}
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://clooud.my.id/... atau https://c.termai.cc/..."
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              onChange(e.target.value);
              if (onOriginalFileUrl) onOriginalFileUrl(e.target.value);
            }}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
          />
          {inputUrl && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 text-[#8e8e93] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl border border-black/10 dark:border-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group ${
            isDragging
              ? "border-[#007aff] bg-[#007aff]/10 scale-[0.99]"
              : value
              ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
              : "border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-[#121214] hover:border-[#007aff]/40 hover:bg-slate-50 dark:hover:bg-[#1a1a1c]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          {isUploading ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="p-3 bg-[#007aff]/10 rounded-full text-[#007aff] animate-spin">
                <Loader2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-black dark:text-white">Mengunggah ke server c.termai.cc...</p>
              <span className="text-xs text-[#8e8e93] dark:text-[#98989d]">Harap tunggu sebentar</span>
            </div>
          ) : value ? (
            <div className="w-full flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=IMG";
                    }}
                  />
                </div>
                <div className="text-left overflow-hidden">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gambar Siap Digunakan</span>
                  </div>
                  <p className="text-xs text-[#8e8e93] dark:text-[#98989d] truncate max-w-[220px] sm:max-w-xs font-mono mt-0.5">
                    {value}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  title="Salin URL Gambar"
                  className="p-2 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#007aff]/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  title="Hapus / Ganti Gambar"
                  className="p-2 text-[#8e8e93] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center gap-2">
              <div className="p-3 bg-[#007aff]/10 text-[#007aff] dark:text-[#0a84ff] rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">
                  Klik untuk pilih atau <span className="text-[#007aff] dark:text-[#0a84ff]">Drag & Drop</span> gambar
                </p>
                <p className="text-xs text-[#8e8e93] dark:text-[#98989d] mt-0.5">{helperText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {copied && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> URL berhasil disalin ke clipboard!
        </p>
      )}

      {uploadError && (
        <div className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
