import React, { useState } from "react";
import { Video, Download, Play, Loader2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { getProxiedVideoUrl, triggerVideoDownload } from "../../services/api";

export const BratvidTool: React.FC = () => {
  const [text, setText] = useState("nexa nich 😱");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) {
      setError("Masukkan teks untuk video Brat.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setVideoUrl(null);

    const apiUrl = `https://apii.nexadev.my.id/bratvid2?text=${encodeURIComponent(text)}`;
    const proxyUrl = getProxiedVideoUrl(apiUrl);

    // Test load video
    const testVideo = document.createElement("video");
    testVideo.src = proxyUrl;
    testVideo.onloadeddata = () => {
      setVideoUrl(apiUrl);
      setIsLoading(false);
    };
    testVideo.onerror = () => {
      // Fallback: sometimes onloadeddata might be delayed, set video URL anyway
      setVideoUrl(apiUrl);
      setIsLoading(false);
    };
  };

  const handleDownload = () => {
    if (videoUrl) {
      triggerVideoDownload(videoUrl, `brat_${Date.now()}.mp4`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-lime-600 font-semibold text-sm mb-1">
          <Video className="w-4 h-4" />
          <span>Kinetic Typography Video Generator</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Brat Video Generator (Bratvid)</h2>
        <p className="text-slate-500 text-sm mt-1">
          Buat video animasi teks kinetik bergaya Brat aesthetic dengan warna latar lime green khas dan ekspor langsung ke format MP4.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleGenerate} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Teks Brat (Mendukung Emoji) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contoh: nexa nich 😱 atau brat summer vibes"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white font-medium"
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Pembuatan Video Gagal</p>
            <p className="text-rose-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Video */}
      {videoUrl && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-lime-600" />
              Hasil Video Brat
            </h3>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Video MP4
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-900">
            <video
              src={getProxiedVideoUrl(videoUrl)}
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
