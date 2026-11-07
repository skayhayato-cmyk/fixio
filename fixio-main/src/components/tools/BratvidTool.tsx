import React, { useState, useEffect, useRef } from "react";
import { Video, Download, Play, Loader2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { generateBratVideo } from "../../services/nexaDevApi";

export const BratvidTool: React.FC = () => {
  const [text, setText] = useState("nexa nich 😱");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);

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
    if (!text.trim()) {
      setError("Masukkan teks untuk video Brat.");
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
    setVideoObjectUrl(null);

    try {
      const result = await generateBratVideo(text, abortControllerRef.current.signal);
      currentObjectUrlRef.current = result.objectUrl;
      setVideoObjectUrl(result.objectUrl);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.message === "Permintaan dibatalkan.") {
        return;
      }
      setError(err.message || "Terjadi kesalahan saat memproses video Brat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (videoObjectUrl) {
      const link = document.createElement("a");
      link.href = videoObjectUrl;
      link.download = `brat_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-lime-600 dark:text-lime-400 font-semibold text-sm mb-1">
          <Video className="w-4 h-4" />
          <span>Kinetic Typography Video Generator</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Brat Video Generator (Bratvid)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Buat video animasi teks kinetik bergaya Brat aesthetic dengan warna latar lime green khas dan ekspor langsung ke format MP4.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleGenerate} className="bg-slate-50/50 dark:bg-[#121214] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Teks Brat (Mendukung Emoji) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contoh: nexa nich 😱 atau brat summer vibes"
            className="w-full px-4 py-3 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !text}
            className="w-full sm:w-auto px-7 py-3 bg-lime-500 hover:bg-lime-600 active:scale-98 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Membuat Video MP4...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Generate Video Brat</span>
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
            <p className="font-semibold">Pembuatan Video Gagal</p>
            <p className="text-rose-600 dark:text-rose-400 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Video */}
      {videoObjectUrl && (
        <div className="bg-white dark:bg-[#121214] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              Hasil Video Brat
            </h3>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Video MP4
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-900 dark:border-white/10">
            <video
              src={videoObjectUrl}
              controls
              autoPlay
              loop
              className="max-h-[380px] w-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
