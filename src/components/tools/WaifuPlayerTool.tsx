import React, { useState, useEffect, useRef } from "react";
import { Music, Download, Disc, Loader2, AlertCircle, Sparkles, Layers, RefreshCw, Layers2 } from "lucide-react";
import { triggerDownload } from "../../services/api";
import { generateWmp } from "../../services/nexaDevApi";

export const WaifuPlayerTool: React.FC = () => {
  const [style, setStyle] = useState<"wmp1" | "wmp2">("wmp1");
  const [line1, setLine1] = useState("ngapain cemburu");
  const [line2, setLine2] = useState("kan");
  const [line3, setLine3] = useState("cuman sebatas");
  const [line4, setLine4] = useState("teman");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImgSrc, setGeneratedImgSrc] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

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

  const getCombinedText = () => {
    return [line1, line2, line3, line4].filter(Boolean).join("|");
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const combined = getCombinedText();
    if (!combined) {
      setError("Masukkan setidaknya satu baris lirik lagu / kata-kata.");
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
    setGeneratedImgSrc(null);

    try {
      const result = await generateWmp(style, combined, abortControllerRef.current.signal);
      currentObjectUrlRef.current = result.objectUrl;
      setGeneratedImgSrc(result.objectUrl);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.message === "Permintaan dibatalkan.") {
        return;
      }
      setError(err.message || "Gagal membuat kartu Windows Media Player. Silakan coba kombinasi teks lain.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImgSrc) {
      triggerDownload(generatedImgSrc, `windows_media_player_${style}_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-xs mb-1">
          <Music className="w-4 h-4" />
          <span>Retro Aesthetic Music Player</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
          Windows Media Player (WMP 1 & 2)
        </h2>
        <p className="text-[#8e8e93] dark:text-[#98989d] text-xs sm:text-sm mt-1">
          Buat kartu pemutar musik bergaya Windows Media Player retro aesthetic dengan lirik bertingkat yang dipisahkan per baris bait lagu.
        </p>
      </div>

      {/* Style Toggle (iOS Segmented Control) */}
      <div className="flex bg-slate-200/70 dark:bg-[#1c1c1e] p-1 rounded-xl border border-black/5 dark:border-white/10 w-full sm:w-80 max-w-full">
        <button
          type="button"
          onClick={() => setStyle("wmp1")}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            style === "wmp1"
              ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
              : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
          }`}
        >
          <Disc className="w-3.5 h-3.5 text-[#007aff]" />
          <span>WMP Style 1</span>
        </button>
        <button
          type="button"
          onClick={() => setStyle("wmp2")}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            style === "wmp2"
              ? "bg-white dark:bg-[#2c2c2e] text-black dark:text-white shadow-sm"
              : "text-[#8e8e93] dark:text-[#98989d] hover:text-black dark:hover:text-white"
          }`}
        >
          <Layers2 className="w-3.5 h-3.5 text-[#007aff]" />
          <span>WMP Style 2</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-4 bg-slate-50/50 dark:bg-[#121214] p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold text-black dark:text-white">
            Baris Lirik / Kata-kata (Akan digabung otomatis):
          </p>
          <span className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
            Format: Teks 1 | Teks 2 | Teks 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] mb-1">
              Baris 1
            </label>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Contoh: ngapain cemburu"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] mb-1">
              Baris 2
            </label>
            <input
              type="text"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Contoh: kan"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] mb-1">
              Baris 3
            </label>
            <input
              type="text"
              value={line3}
              onChange={(e) => setLine3(e.target.value)}
              placeholder="Contoh: cuman sebatas"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] dark:text-[#98989d] mb-1">
              Baris 4
            </label>
            <input
              type="text"
              value={line4}
              onChange={(e) => setLine4(e.target.value)}
              placeholder="Contoh: teman"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-xl text-xs sm:text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-xl border border-black/5 dark:border-white/10 text-xs text-[#8e8e93] dark:text-[#98989d] flex items-center justify-between">
          <span>Pratinjau Parameter:</span>
          <span className="font-mono text-[#007aff] dark:text-[#0a84ff] font-semibold">
            {getCombinedText() || "(kosong)"}
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !getCombinedText()}
            className="w-full sm:w-auto px-6 py-2.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Kartu WMP...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Buat Windows Media Player</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Proses Gagal</p>
            <p className="text-xs mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {generatedImgSrc && (
        <div className="space-y-4 pt-2 animate-ios-fade">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-[#007aff]" />
              Hasil Windows Media Player
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3.5 py-1.5 ios-btn-primary text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Gambar (PNG)
              </button>
              <button
                onClick={() => handleGenerate()}
                className="text-xs font-semibold text-[#8e8e93] dark:text-[#98989d] hover:text-[#007aff] dark:hover:text-[#0a84ff] flex items-center gap-1 cursor-pointer p-1.5"
                title="Generate Ulang"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-black/10 dark:border-white/10 shadow-inner">
            <img
              src={generatedImgSrc}
              alt="Windows Media Player Card"
              className="max-h-[460px] w-auto rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
