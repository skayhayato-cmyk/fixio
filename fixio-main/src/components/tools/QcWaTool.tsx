import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Download, Sun, Moon, Image as ImageIcon, Loader2, AlertCircle, RefreshCw, Sparkles, Tag, CheckCircle2 } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { triggerDownload } from "../../services/api";
import { generateQcWa } from "../../services/nexaDevApi";
import { renderQcWaCanvas } from "../../services/canvasGenerators";

export const QcWaTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"standard" | "withImage">("withImage");
  const [usn, setUsn] = useState("raja iblis");
  const [phone, setPhone] = useState("6287876034799");
  const [ppUrl, setPpUrl] = useState("https://clooud.my.id/uploder/uploads/BJLnsy.png");
  const [text, setText] = useState("btw ini my bini gw");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [tag, setTag] = useState("ara-ara");
  const [imgUrl, setImgUrl] = useState("https://clooud.my.id/uploder/uploads/MRzOni.jpg");

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
    if (!usn || !text || !ppUrl) {
      setError("Harap lengkapi Username, Foto Profil, dan Pesan Teks.");
      return;
    }

    if (activeTab === "withImage" && !imgUrl) {
      setError("Harap unggah gambar lampiran untuk mode QCWA Gambar.");
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
    setEngineUsed(null);

    try {
      const result = await generateQcWa(
        {
          usn,
          phone,
          pp: ppUrl,
          text,
          mode,
          tag: tag || undefined,
          img: activeTab === "withImage" ? imgUrl : undefined,
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
        const canvasDataUrl = await renderQcWaCanvas(usn, text, mode, ppUrl);
        setGeneratedImgSrc(canvasDataUrl);
        setEngineUsed("Fixio Canvas Engine (Offline Backup)");
      } catch (canvasErr: any) {
        setError(err.message || canvasErr.message || "Gagal membuat gambar Quote WA.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImgSrc) {
      triggerDownload(generatedImgSrc, `qcwa_${usn.replace(/\s+/g, "_")}_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm mb-1">
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Bubble Quote Maker</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Quote Chat WhatsApp (QCWA)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Buat stiker kutipan chat WhatsApp autentik dengan nama, nomor, foto profil custom, tema Light/Dark, serta lampiran gambar.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-100 dark:bg-[#1c1c1e] p-1.5 rounded-2xl w-fit border border-black/5 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("withImage")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "withImage"
              ? "bg-white dark:bg-[#2c2c2e] text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          QCWA dengan Gambar Lampiran
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("standard")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "standard"
              ? "bg-white dark:bg-[#2c2c2e] text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          QCWA Standar (Hanya Teks)
        </button>
      </div>

      {/* Form Input */}
      <form onSubmit={handleGenerate} className="bg-slate-50/50 dark:bg-[#121214] p-5 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Nama Pengirim (Username) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              placeholder="Contoh: Raja Iblis"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Nomor Telepon (Phone)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 6287876034799"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Profile Picture (Drag & Drop) */}
        <ImageUploaderZone
          label="Foto Profil WhatsApp (PP)"
          helperText="Drag & drop avatar profil di sini"
          value={ppUrl}
          onChange={setPpUrl}
          required
        />

        {/* Message Text */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
            Pesan Chat WhatsApp <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tuliskan kalimat chat quote di sini..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
          />
        </div>

        {/* Mode & Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Tag Badge (Role/Tag)
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Contoh: ara-ara atau admin"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Tema Tampilan (Mode)
            </label>
            <div className="flex bg-slate-100 dark:bg-[#1c1c1e] p-1 rounded-xl border border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setMode("light")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "light"
                    ? "bg-white dark:bg-[#2c2c2e] text-amber-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => setMode("dark")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "dark"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark Mode
              </button>
            </div>
          </div>
        </div>

        {/* If Mode with Image: show second uploader */}
        {activeTab === "withImage" && (
          <div className="pt-2 border-t border-black/5 dark:border-white/10">
            <ImageUploaderZone
              label="Lampiran Gambar di dalam Chat"
              helperText="Drag & drop foto yang dikirim di dalam bubble chat"
              value={imgUrl}
              onChange={setImgUrl}
              required
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membuat Quote WA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Quote Chat</span>
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
            <p className="font-semibold">Gagal Membuat Quote</p>
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
                Hasil Quote WhatsApp
              </h3>
              {engineUsed && (
                <span className="text-[11px] font-semibold text-slate-400">
                  Engine: <span className="text-emerald-600 dark:text-emerald-400">{engineUsed}</span>
                </span>
              )}
            </div>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Gambar PNG
            </button>
          </div>

          <div className="p-6 bg-slate-100 dark:bg-[#1c1c1e] rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10">
            <img
              src={generatedImgSrc}
              alt="QCWA Result"
              className="max-h-[420px] w-auto rounded-xl shadow-md object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
