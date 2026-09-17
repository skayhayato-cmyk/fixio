import React, { useState } from "react";
import { MessageSquareQuote, Download, Loader2, AlertCircle, Sparkles, User } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";

export const TtqcTool: React.FC = () => {
  const [ppUrl, setPpUrl] = useState("https://clooud.my.id/uploder/uploads/fRkHHO.jpeg");
  const [name, setName] = useState("NexaDev");
  const [text, setText] = useState("halo gua nexa");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImgSrc, setGeneratedImgSrc] = useState<string | null>(null);

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name || !text || !ppUrl) {
      setError("Harap lengkapi Nama, Komentar, dan Foto Profil.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedImgSrc(null);

    const params = new URLSearchParams();
    params.append("url", ppUrl);
    params.append("name", name);
    params.append("text", text);

    const apiUrl = `https://apii.nexadev.my.id/ttqc?${params.toString()}`;
    const proxyUrl = getProxiedImageUrl(apiUrl);

    const img = new Image();
    img.onload = () => {
      setGeneratedImgSrc(apiUrl);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError("Gagal membuat TikTok Quote. Pastikan parameter URL gambar valid.");
      setIsLoading(false);
    };
    img.src = proxyUrl;
  };

  const handleDownload = () => {
    if (generatedImgSrc) {
      triggerDownload(generatedImgSrc, `ttqc_${name.replace(/\s+/g, "_")}_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-1">
          <MessageSquareQuote className="w-4 h-4" />
          <span>TikTok Comment Card Maker</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">TikTok Quote Comment (TTQC)</h2>
        <p className="text-slate-500 text-sm mt-1">
          Buat kartu sorotan komentar TikTok estetik dengan nama pembuat, foto avatar, dan bubble teks komentar.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Nama Pengguna TikTok <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: NexaDev"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Teks Komentar <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tuliskan komentar TikTok di sini..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white resize-none font-medium"
          />
        </div>

        <ImageUploaderZone
          label="Foto Profil TikTok"
          helperText="Drag & drop avatar profil di sini"
          value={ppUrl}
          onChange={setPpUrl}
          required
        />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat TikTok Quote...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate TTQC</span>
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
            <p className="font-semibold">Proses Gagal</p>
            <p className="text-rose-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {generatedImgSrc && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-rose-600" />
              Hasil TikTok Quote Card
            </h3>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Unduh PNG
            </button>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-900">
            <img
              src={getProxiedImageUrl(generatedImgSrc)}
              alt="TTQC Result"
              className="max-h-[420px] w-auto rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
