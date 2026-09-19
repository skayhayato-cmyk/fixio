import React, { useState } from "react";
import { UploadCloud, CheckCircle2, Copy, ExternalLink, Image as ImageIcon, Sparkles, FileText, Check } from "lucide-react";
import { ImageUploaderZone } from "../ImageUploaderZone";

interface StandaloneUploaderToolProps {
  onSelectTool?: (toolId: string) => void;
}

export const StandaloneUploaderTool: React.FC<StandaloneUploaderToolProps> = ({ onSelectTool }) => {
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-1">
          <UploadCloud className="w-4 h-4" />
          <span>High-Speed Cloud Storage CDN</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Image Uploader (Termai CDN)</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Unggah gambar dengan cepat ke cloud hosting c.termai.cc untuk mendapatkan tautan CDN langsung yang siap digunakan di semua tool Fixio atau dibagikan ke internet.
        </p>
      </div>

      {/* Uploader Box */}
      <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-xs space-y-4">
        <ImageUploaderZone
          label="Pilih atau Drag & Drop Gambar"
          helperText="Format didukung: JPG, PNG, WebP, GIF (Maks. 25MB)"
          value={uploadedUrl}
          onChange={setUploadedUrl}
        />

        {uploadedUrl && (
          <div className="p-4 bg-slate-50 dark:bg-[#1c1c1e] rounded-2xl border border-black/5 dark:border-white/10 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Gambar Berhasil Diunggah ke Cloud!
              </span>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Buka Link Asli <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={uploadedUrl}
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/15 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin URL
                  </>
                )}
              </button>
            </div>

            {/* Quick Actions with other tools */}
            {onSelectTool && (
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Gunakan gambar ini pada:</span>
                <button
                  onClick={() => onSelectTool("wink-hd")}
                  className="px-3 py-1 bg-white dark:bg-[#2c2c2e] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  ✨ Wink HD
                </button>
                <button
                  onClick={() => onSelectTool("remove-bg")}
                  className="px-3 py-1 bg-white dark:bg-[#2c2c2e] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  ✂️ Remove BG
                </button>
                <button
                  onClick={() => onSelectTool("qcwa")}
                  className="px-3 py-1 bg-white dark:bg-[#2c2c2e] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-white/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  💬 Quote WA
                </button>
                <button
                  onClick={() => onSelectTool("fake-call")}
                  className="px-3 py-1 bg-white dark:bg-[#2c2c2e] hover:bg-green-50 dark:hover:bg-green-950/40 border border-slate-200 dark:border-white/10 text-green-700 dark:text-green-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  📞 Fake Call
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
