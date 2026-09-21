import React, { useState } from "react";
import { QrCode, UploadCloud, Link2, Download, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";
import { downloadMedia } from "../../services/api";

interface ToQrToolProps {
  onSelectTool?: (toolId: string) => void;
}

export const ToQrTool: React.FC<ToQrToolProps> = ({ onSelectTool }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("https://clooud.my.id/uploder/uploads/ISsVGW.jpg");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [lastTargetUrl, setLastTargetUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  const sampleUrl = "https://clooud.my.id/uploder/uploads/ISsVGW.jpg";

  const getTargetUrl = () => {
    if (activeTab === "upload") {
      return imageUrl.trim();
    }
    return directUrl.trim();
  };

  const handleGenerate = (targetOverride?: string) => {
    const rawTarget = targetOverride || getTargetUrl();
    if (!rawTarget) {
      setError(activeTab === "upload" ? "Silakan unggah foto terlebih dahulu." : "Silakan masukkan URL atau teks.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Build NexaDev To QR API URL
      const apiEndpoint = `https://api.nexadev.my.id/tools/toqr?url=${encodeURIComponent(rawTarget)}`;
      // Wrap in image proxy to avoid CORS/Cloudflare issues and ensure instant loading
      const proxiedQrUrl = `/api/proxy-image?url=${encodeURIComponent(apiEndpoint)}`;

      setLastTargetUrl(rawTarget);
      setQrCodeUrl(proxiedQrUrl);
    } catch (err: any) {
      setError("Gagal membuat QR Code. Periksa kembali tautan Anda.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!lastTargetUrl) return;
    const downloadUrl = `/api/proxy-image?url=${encodeURIComponent(
      `https://api.nexadev.my.id/tools/toqr?url=${encodeURIComponent(lastTargetUrl)}`
    )}&download=true&filename=qrcode_${Date.now()}.png`;
    downloadMedia(downloadUrl, `Fixio_QRCode_${Date.now()}.png`, "image/png");
  };

  const handleCopyQrLink = () => {
    if (!lastTargetUrl) return;
    const fullApiUrl = `https://api.nexadev.my.id/tools/toqr?url=${encodeURIComponent(lastTargetUrl)}`;
    navigator.clipboard.writeText(fullApiUrl);
    setCopiedQr(true);
    setTimeout(() => setCopiedQr(false), 2000);
  };

  const handleCopyTargetUrl = () => {
    if (!lastTargetUrl) return;
    navigator.clipboard.writeText(lastTargetUrl);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff] font-semibold text-sm mb-1">
          <QrCode className="w-4 h-4" />
          <span>Generator Kode QR Interaktif</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          To QR Code Generator
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Ubah tautan URL, teks, atau foto/gambar yang diunggah menjadi kode QR PNG berkualitas tinggi secara cepat dan gratis.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-5">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 max-w-md">
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setError(null);
            }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Foto</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setError(null);
            }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "url"
                ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Direct URL / Teks</span>
          </button>
        </div>

        {/* Input Area */}
        {activeTab === "upload" ? (
          <div className="space-y-3">
            <ImageUploaderZone
              label="Pilih Foto / Gambar untuk Dijadikan QR"
              helperText="Foto akan diunggah ke CDN publik c.termai.cc untuk menghasilkan URL QR otomatis"
              value={imageUrl}
              onChange={(url) => {
                setImageUrl(url);
                if (url) {
                  handleGenerate(url);
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-black dark:text-white flex items-center justify-between">
              <span>Masukkan Tautan URL atau Teks</span>
              <button
                type="button"
                onClick={() => {
                  setDirectUrl(sampleUrl);
                  handleGenerate(sampleUrl);
                }}
                className="text-xs text-[#007aff] dark:text-[#0a84ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sparkles className="w-3 h-3" /> Gunakan Contoh Link
              </button>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: https://clooud.my.id/uploder/uploads/ISsVGW.jpg"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-[#1c1c1e] border border-black/10 dark:border-white/10 rounded-2xl text-sm text-black dark:text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="px-5 py-3 bg-[#007aff] hover:bg-[#0062cc] active:scale-95 text-white font-semibold text-sm rounded-2xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Buat QR</span>
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* QR Code Result Preview */}
        {qrCodeUrl && (
          <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-500" />
                <span>Hasil QR Code</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">500 x 500 PNG</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-[#1c1c1e] p-5 rounded-3xl border border-black/5 dark:border-white/10">
              {/* QR Image Box */}
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0 group">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                  onError={() => setError("Gagal memuat gambar QR Code. Coba muat ulang.")}
                />
              </div>

              {/* Information & Action Buttons */}
              <div className="flex-1 space-y-3 w-full text-center sm:text-left min-w-0">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Target Link / Data:
                  </label>
                  <a
                    href={lastTargetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center sm:justify-start gap-1 truncate"
                    title={lastTargetUrl}
                  >
                    <span className="truncate">{lastTargetUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Unduh QR PNG
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyQrLink}
                    className="px-3.5 py-2.5 bg-white dark:bg-[#2c2c2e] hover:bg-slate-100 dark:hover:bg-[#3a3a3c] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedQr ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedQr ? "Tersalin!" : "Salin API Link"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTargetUrl}
                    className="px-3.5 py-2.5 bg-white dark:bg-[#2c2c2e] hover:bg-slate-100 dark:hover:bg-[#3a3a3c] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedTarget ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedTarget ? "Tersalin!" : "Salin Target Link"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
