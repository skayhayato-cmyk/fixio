import React from "react";
import { X, Share, PlusSquare, Download, MoreVertical, Smartphone, Laptop, CheckCircle2 } from "lucide-react";
import { Logo } from "./Logo";

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "id" | "en";
  isIOS: boolean;
  onNativeInstall?: () => void;
  isInstallable?: boolean;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  isIOS,
  onNativeInstall,
  isInstallable,
}) => {
  if (!isOpen) return null;

  const isId = language === "id";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-ios-fade">
      <div 
        className="w-full max-w-md bg-[#f2f2f7] dark:bg-[#121214] text-black dark:text-white rounded-3xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#1c1c1e] border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <div>
              <h3 className="text-sm font-semibold text-black dark:text-white">
                {isId ? "Pasang Fixio (PWA)" : "Install Fixio App"}
              </h3>
              <p className="text-[11px] text-[#8e8e93] dark:text-[#98989d]">
                {isId ? "Akses cepat tanpa browser tab" : "Quick access like native app"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8e8e93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Quick Install Banner if browser supports one-click prompt */}
          {isInstallable && onNativeInstall && (
            <div className="p-3.5 bg-[#007aff]/10 border border-[#007aff]/20 rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#007aff] dark:text-[#0a84ff] block">
                  {isId ? "Dukungan Instal Cepat" : "One-Click Install Ready"}
                </span>
                <span className="text-[11px] text-neutral-600 dark:text-neutral-300 block">
                  {isId ? "Klik untuk menginstal langsung" : "Click to trigger system prompt"}
                </span>
              </div>
              <button
                onClick={() => {
                  onNativeInstall();
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-[#007aff] hover:bg-[#007aff]/90 active:scale-95 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isId ? "Pasang Sekarang" : "Install Now"}</span>
              </button>
            </div>
          )}

          {/* iOS Safari Guide */}
          {isIOS ? (
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                <Smartphone className="w-4 h-4 text-[#007aff]" />
                <span>{isId ? "Panduan iOS (Safari)" : "iOS Safari Instructions"}</span>
              </div>

              <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#007aff]/10 text-[#007aff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-black dark:text-white">
                      {isId ? "Buka di Browser Safari" : "Open in Safari browser"}
                    </p>
                    <p className="text-[11px] text-[#8e8e93]">
                      {isId ? "Pastikan halaman dibuka di Safari bawaan iPhone/iPad." : "Ensure you are viewing this page in Safari on iOS."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#007aff]/10 text-[#007aff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-black dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span>{isId ? "Tekan tombol Bagikan" : "Tap the Share button"}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded font-mono text-[10px]">
                        <Share className="w-3 h-3" /> Share
                      </span>
                    </p>
                    <p className="text-[11px] text-[#8e8e93]">
                      {isId ? "Terletak di bilah bawah Safari." : "Located at the bottom Safari navigation bar."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#007aff]/10 text-[#007aff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-black dark:text-white flex items-center gap-1.5 flex-wrap">
                      <span>{isId ? "Pilih" : "Select"}</span>
                      <strong className="text-[#007aff]">
                        {isId ? "Tambah ke Layar Utama" : "Add to Home Screen"}
                      </strong>
                    </p>
                    <p className="text-[11px] text-[#8e8e93]">
                      {isId ? "Gulir ke bawah pada menu bagikan lalu ketuk ikon tambah." : "Scroll down the share sheet and tap Add to Home Screen."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Desktop / Chrome / Edge Guide */
            <div className="space-y-3">
              {/* Android Section */}
              <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>{isId ? "Android (Chrome / Samsung / Edge)" : "Android (Chrome / Samsung / Edge)"}</span>
                </div>

                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>{isId ? "Ketuk tombol titik tiga" : "Tap the three-dots menu"} <strong className="inline-flex items-center px-1 bg-neutral-200 dark:bg-neutral-800 rounded font-mono text-[10px]"><MoreVertical className="w-3 h-3" /></strong> {isId ? "di kanan atas." : "in the top-right."}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>{isId ? "Pilih" : "Select"} <strong className="text-emerald-600 dark:text-emerald-400">{isId ? "Instal aplikasi" : "Install app"}</strong> / <strong>{isId ? "Tambahkan ke Layar Utama" : "Add to Home screen"}</strong>.</span>
                  </p>
                </div>
              </div>

              {/* Desktop Section */}
              <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl border border-black/5 dark:border-white/10 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  <Laptop className="w-4 h-4 text-indigo-500" />
                  <span>{isId ? "Komputer / Laptop (Chrome / Edge)" : "Desktop (Chrome / Edge)"}</span>
                </div>

                <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span>{isId ? "Klik ikon instal" : "Click the install icon"} <strong className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-[10px]">⊕</strong> {isId ? "di ujung kanan bilah alamat (URL bar)." : "in the right side of the address bar."}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span>{isId ? "Atau klik Menu (⋮) → Simpan & bagikan → Pasang Fixio." : "Or click Menu (⋮) → Save and share → Install Fixio."}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="p-3 bg-neutral-100 dark:bg-neutral-900/60 rounded-xl space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1.5 font-medium text-black dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isId ? "Kelebihan Menginstal Fixio:" : "Benefits of Installing Fixio:"}</span>
            </div>
            <p>• {isId ? "Membuka langsung dalam jendela layar penuh mandiri." : "Launches directly in full-screen standalone mode."}</p>
            <p>• {isId ? "Performa lebih cepat tanpa bilah navigasi browser." : "Faster, lightweight access without browser tab clutter."}</p>
            <p>• {isId ? "Ikon siap pakai di beranda HP / Desktop." : "Instant launcher icon on your home screen or dock."}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white dark:bg-[#1c1c1e] border-t border-black/5 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            {isId ? "Mengerti" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
};
