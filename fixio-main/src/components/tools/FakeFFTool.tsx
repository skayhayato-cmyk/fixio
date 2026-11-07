import React, { useState, useEffect, useRef } from "react";
import { Flame, Download, Users, User, Loader2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { triggerDownload } from "../../services/api";
import { generateFakeFF } from "../../services/nexaDevApi";
import { renderFakeFFDuoCanvas, renderFakeFFSoloCanvas } from "../../services/canvasGenerators";

export const FakeFFTool: React.FC = () => {
  const [mode, setMode] = useState<"duo" | "solo">("duo");
  const [nickname1, setNickname1] = useState("Nexa 😡");
  const [nickname2, setNickname2] = useState("Xy Pemula");
  const [soloNickname, setSoloNickname] = useState("NexaDev");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImgSrc, setGeneratedImgSrc] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

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

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (mode === "duo" && (!nickname1 || !nickname2)) {
      setError("Harap masukkan kedua nickname untuk mode Duo.");
      return;
    }
    if (mode === "solo" && !soloNickname) {
      setError("Harap masukkan nickname untuk mode Solo.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    if (currentObjectUrlRef.current && currentObjectUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
    setGeneratedImgSrc(null);
    setEngineUsed(null);

    try {
      const result = await generateFakeFF(
        {
          mode,
          usn: soloNickname,
          nickname1,
          nickname2,
        },
        abortControllerRef.current.signal
      );
      currentObjectUrlRef.current = result.objectUrl;
      setGeneratedImgSrc(result.objectUrl);
      setEngineUsed("NexaDev API (Direct Image Binary)");
    } catch (err: any) {
      if (err.name === "CanceledError" || err.message === "Permintaan dibatalkan.") {
        return;
      }
      console.warn("API issue, using canvas fallback:", err);
      try {
        let canvasDataUrl = "";
        if (mode === "duo") {
          canvasDataUrl = await renderFakeFFDuoCanvas(nickname1, nickname2);
        } else {
          canvasDataUrl = await renderFakeFFSoloCanvas(soloNickname);
        }
        setGeneratedImgSrc(canvasDataUrl);
        setEngineUsed("Fixio Canvas Engine (Offline Backup)");
      } catch (canvasErr: any) {
        setError(err.message || canvasErr.message || "Gagal membuat gambar profil Free Fire.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImgSrc) {
      triggerDownload(generatedImgSrc, `fake_ff_${mode}_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm mb-1">
          <Flame className="w-4 h-4" />
          <span>Game Profile Generator</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Fake Free Fire Profile (Solo & Duo)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Buat kartu profil dan lobby Free Fire kustom dengan nickname pilihan Anda (mendukung simbol dan emoji).
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-100 dark:bg-[#1c1c1e] p-1.5 rounded-2xl w-fit border border-black/5 dark:border-white/10">
        <button
          type="button"
          onClick={() => setMode("duo")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mode === "duo"
              ? "bg-white dark:bg-[#2c2c2e] text-amber-700 dark:text-amber-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> Mode Duo
        </button>
        <button
          type="button"
          onClick={() => setMode("solo")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            mode === "solo"
              ? "bg-white dark:bg-[#2c2c2e] text-amber-700 dark:text-amber-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="w-4 h-4" /> Mode Solo
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleGenerate} className="bg-slate-50/50 dark:bg-[#121214] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
        {mode === "duo" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Nickname Player 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nickname1}
                onChange={(e) => setNickname1(e.target.value)}
                placeholder="Contoh: Nexa 😡"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Nickname Player 2 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nickname2}
                onChange={(e) => setNickname2(e.target.value)}
                placeholder="Contoh: Xy Pemula"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Nickname Player Solo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={soloNickname}
              onChange={(e) => setSoloNickname(e.target.value)}
              placeholder="Contoh: NexaDev"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 active:scale-98 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Gambar FF...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Generate Fake FF {mode === "duo" ? "Duo" : "Solo"}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Proses Gagal</p>
            <p className="text-rose-600 dark:text-rose-400 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {generatedImgSrc && (
        <div className="bg-white dark:bg-[#121214] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Hasil Free Fire Profile {mode === "duo" ? "Duo" : "Solo"}
              </h3>
              {engineUsed && (
                <span className="text-[11px] font-semibold text-slate-400">
                  Engine: <span className="text-amber-600 dark:text-amber-400">{engineUsed}</span>
                </span>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" /> Unduh PNG
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-900 dark:border-white/10">
            <img
              src={generatedImgSrc}
              alt="Fake FF Result"
              className="max-h-[440px] w-auto rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
