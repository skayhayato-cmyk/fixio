import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle, Copy, Check, RefreshCw, FileText, Image as ImageIcon, ExternalLink, MessageSquare, Terminal } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { getImageToPrompt } from "../../services/nexaDevApi";

export const ImgToPromptTool: React.FC = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptResult, setPromptResult] = useState<string | null>(null);
  const [activeCopiedKey, setActiveCopiedKey] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sampleUrl = "https://clooud.my.id/uploder/uploads/ISsVGW.jpg";

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleGeneratePrompt = async () => {
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
    setPromptResult(null);

    try {
      const promptText = await getImageToPrompt(imageUrl, abortControllerRef.current.signal);
      setPromptResult(promptText);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.message === "Permintaan dibatalkan.") {
        return;
      }
      setError(err.message || "Gagal memperoleh deskripsi prompt dari gambar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setActiveCopiedKey(key);
    setTimeout(() => setActiveCopiedKey(null), 2000);
  };

  const wordCount = promptResult ? promptResult.split(/\s+/).filter(Boolean).length : 0;
  const charCount = promptResult ? promptResult.length : 0;

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Reverse Image Prompt Generator</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Image to Prompt AI
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Ubah foto atau gambar menjadi deskripsi prompt AI yang detail. Cocok untuk digunakan kembali di Midjourney, DALL-E, atau Stable Diffusion.
        </p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm font-semibold text-black dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#007aff]" />
            <span>Pilih Gambar Target</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setImageUrl(sampleUrl);
              setLocalPreviewUrl(sampleUrl);
            }}
            className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" /> Gunakan Contoh Gambar
          </button>
        </div>

        <ImageUploaderZone
          label=""
          helperText="Drag & drop gambar di sini atau klik untuk memilih file"
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url);
            if (!url) {
              setPromptResult(null);
              setError(null);
            }
          }}
          onOriginalFileUrl={setLocalPreviewUrl}
          required
        />

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleGeneratePrompt}
            disabled={!imageUrl || isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#007aff] hover:bg-[#0062cc] active:scale-95 text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menganalisis Gambar & Ekstrak Prompt...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Hasilkan Deskripsi Prompt</span>
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

      {/* Prompt Result Section */}
      {promptResult && (
        <div className="space-y-5 pt-2 animate-ios-fade">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <h3 className="text-base font-bold text-black dark:text-white">Hasil Analisis Prompt AI</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                {wordCount} Kata • {charCount} Karakter
              </span>
              <button
                type="button"
                onClick={handleGeneratePrompt}
                className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] hover:opacity-80 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Analisis Ulang
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Image Preview Box */}
            <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Gambar Terdeteksi
              </span>
              <div className="aspect-square w-full rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 overflow-hidden relative flex items-center justify-center">
                <img
                  src={localPreviewUrl || imageUrl}
                  alt="Source"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#007aff] hover:underline flex items-center justify-center gap-1 pt-1"
              >
                <span>Lihat Gambar Utama</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Prompt Text & Presets */}
            <div className="md:col-span-2 space-y-4">
              {/* Primary Raw Prompt Box */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3 relative group">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Raw AI Prompt
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(promptResult, "raw")}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {activeCopiedKey === "raw" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm sm:text-base leading-relaxed font-mono font-medium text-slate-200 select-all whitespace-pre-wrap">
                  "{promptResult}"
                </p>
              </div>

              {/* Quick Preset Generators */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Format Prompt Siap Pakai Generator AI:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Midjourney Preset */}
                  <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Midjourney v6</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`/imagine prompt: ${promptResult} --v 6.0`, "mj")}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                        title="Salin Format Midjourney"
                      >
                        {activeCopiedKey === "mj" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      /imagine prompt: {promptResult.slice(0, 30)}...
                    </p>
                  </div>

                  {/* DALL-E 3 Preset */}
                  <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">DALL-E 3</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`A highly detailed photograph of ${promptResult}`, "dalle")}
                        className="p-1 text-slate-500 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                        title="Salin Format DALL-E 3"
                      >
                        {activeCopiedKey === "dalle" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      A highly detailed photograph of...
                    </p>
                  </div>

                  {/* Stable Diffusion Preset */}
                  <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Stable Diffusion</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`masterpiece, best quality, highly detailed, ${promptResult}`, "sd")}
                        className="p-1 text-slate-500 hover:text-amber-600 rounded transition-colors cursor-pointer"
                        title="Salin Format Stable Diffusion"
                      >
                        {activeCopiedKey === "sd" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      masterpiece, best quality...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
