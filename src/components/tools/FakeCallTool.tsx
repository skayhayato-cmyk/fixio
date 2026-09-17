import React, { useState } from "react";
import { PhoneCall, Download, Loader2, AlertCircle, Sparkles, Clock, User, CheckCircle2 } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";
import { renderFakeCallCanvas } from "../../services/canvasGenerators";

export const FakeCallTool: React.FC = () => {
  const [ppUrl, setPpUrl] = useState("https://clooud.my.id/uploder/uploads/SggiMA.jpeg");
  const [name, setName] = useState("NexaDev");
  const [duration, setDuration] = useState("19.45");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImgSrc, setGeneratedImgSrc] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name || !ppUrl) {
      setError("Harap isi Nama Penelpon dan unggah Foto Profil.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedImgSrc(null);
    setEngineUsed(null);

    const params = new URLSearchParams();
    params.append("ppurl", ppUrl);
    params.append("name", name);
    params.append("duration", duration || "00.00");

    const apiUrl = `https://apii.nexadev.my.id/fakecall?${params.toString()}`;

    try {
      // Fetch binary image output directly from API endpoint
      const proxyUrl = getProxiedImageUrl(apiUrl);
      const res = await fetch(proxyUrl);
      
      if (!res.ok) {
        throw new Error(`API merespon dengan status ${res.status}`);
      }

      const blob = await res.blob();
      if (!blob.type.includes("image") && blob.size < 500) {
        throw new Error("Respon dari API bukan file gambar valid.");
      }

      const blobUrl = URL.createObjectURL(blob);
      setGeneratedImgSrc(blobUrl);
      setEngineUsed("NexaDev API (Direct Image Binary)");
    } catch (err: any) {
      console.warn("API direct binary fetch issue, switching to fallback:", err);
      // Fallback to high-fidelity canvas generator if connection fails
      try {
        const canvasDataUrl = await renderFakeCallCanvas(name, duration, ppUrl);
        setGeneratedImgSrc(canvasDataUrl);
        setEngineUsed("Fixio Canvas Engine (Offline Backup)");
      } catch (canvasErr: any) {
        setError(err.message || canvasErr.message || "Gagal membuat gambar Fake Call.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImgSrc) {
      triggerDownload(generatedImgSrc, `fakecall_${name.replace(/\s+/g, "_")}_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-green-600 font-semibold text-sm mb-1">
          <PhoneCall className="w-4 h-4" />
          <span>Call Screen Simulator</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fake Call Generator</h2>
        <p className="text-slate-500 text-sm mt-1">
          Buat tangkapan layar panggilan suara palsu yang tampak nyata dengan nama kontak, durasi berbicara, dan foto profil pilihan Anda.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Nama Penelpon <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: NexaDev atau Crush ❤️"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Durasi Panggilan (Menit.Detik)
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Contoh: 19.45 atau 01:23:45"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white font-mono"
            />
          </div>
        </div>

        {/* Profile Picture */}
        <ImageUploaderZone
          label="Foto Profil Penelpon (PP)"
          helperText="Drag & drop foto wajah / avatar penelpon"
          value={ppUrl}
          onChange={setPpUrl}
          required
        />

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 bg-green-600 hover:bg-green-700 active:scale-98 text-white font-semibold rounded-xl shadow-md hover:shadow-green-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Fake Call...</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4" />
                <span>Generate Fake Call</span>
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
                Tampilan Panggilan Suara
              </h3>
              {engineUsed && (
                <span className="text-[11px] font-semibold text-slate-400">
                  Engine: <span className="text-green-600">{engineUsed}</span>
                </span>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" /> Unduh PNG
            </button>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800">
            <img
              src={generatedImgSrc.startsWith("data:") ? generatedImgSrc : getProxiedImageUrl(generatedImgSrc)}
              alt="Fake Call Result"
              className="max-h-[460px] w-auto rounded-2xl shadow-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
