import React, { useState } from "react";
import { Smartphone, Download, Loader2, AlertCircle, Sparkles, Calendar, Clock, User, Type, CheckCircle2 } from "lucide-react";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";
import { renderNokiaCanvas } from "../../services/canvasGenerators";

export const NokiaCanvasTool: React.FC = () => {
  const [text, setText] = useState("kata-kata hari ini: jangan lupa ngoding");
  const [from, setFrom] = useState("nexa");
  const [date, setDate] = useState("08/06/2026");
  const [time, setTime] = useState("12:00");
  const [title, setTitle] = useState("nexa");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImgSrc, setGeneratedImgSrc] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text || !from) {
      setError("Harap isi teks pesan dan nama pengirim.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedImgSrc(null);
    setEngineUsed(null);

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("from", from);
    params.append("date", date || "08/06/2026");
    params.append("time", time || "12:00");
    params.append("title", title || "nexa");

    const apiUrl = `https://apii.nexadev.my.id/nokia?${params.toString()}`;

    try {
      const proxyUrl = getProxiedImageUrl(apiUrl);
      const res = await fetch(proxyUrl);
      
      if (!res.ok) {
        throw new Error(`API merespon dengan status ${res.status}`);
      }

      const blob = await res.blob();
      if (!blob.type.includes("image") && blob.size < 500) {
        throw new Error("Respon dari API bukan gambar valid.");
      }

      const blobUrl = URL.createObjectURL(blob);
      setGeneratedImgSrc(blobUrl);
      setEngineUsed("NexaDev API (Direct Image Binary)");
    } catch (err: any) {
      console.warn("API issue, using canvas fallback:", err);
      // Fallback to high-fidelity canvas generator
      try {
        const canvasDataUrl = await renderNokiaCanvas(text, from, date, time);
        setGeneratedImgSrc(canvasDataUrl);
        setEngineUsed("Fixio Canvas Engine (Offline Backup)");
      } catch (canvasErr: any) {
        setError(err.message || canvasErr.message || "Gagal membuat gambar layar Nokia.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImgSrc) {
      triggerDownload(generatedImgSrc, `nokia_sms_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm mb-1">
          <Smartphone className="w-4 h-4" />
          <span>Retro Screen Generator</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nokia 3310 SMS Canvas</h2>
        <p className="text-slate-500 text-sm mt-1">
          Buat gambar pesan SMS nostalgia layar hijau monokrom klasik Nokia 3310 lengkap dengan tanggal, jam, dan judul operator.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Pesan SMS Nokia <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis pesan SMS nostalgia..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Pengirim (From) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Contoh: nexa atau pacar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-slate-400" /> Header Title (Operator / Label)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: nexa atau INDOSAT"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal (DD/MM/YYYY)
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Contoh: 08/06/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Waktu (HH:MM)
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Contoh: 12:00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Tampilan Nokia...</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span>Generate Nokia Canvas</span>
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
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Layar Nokia 3310 Vintage
              </h3>
              {engineUsed && (
                <span className="text-[11px] font-semibold text-slate-400">
                  Engine: <span className="text-teal-600">{engineUsed}</span>
                </span>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" /> Unduh PNG
            </button>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800">
            <img
              src={generatedImgSrc.startsWith("data:") ? generatedImgSrc : getProxiedImageUrl(generatedImgSrc)}
              alt="Nokia Result"
              className="max-h-[420px] w-auto rounded-xl shadow-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
