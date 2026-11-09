import React from "react";

interface FooterProps {
  onOpenSettings?: () => void;
  language?: "id" | "en";
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings, language = "en" }) => {
  return (
    <footer className="mt-auto py-5 px-4 bg-[#0d0d10] border-t border-neutral-850 text-xs text-neutral-400">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#ffe600] text-black font-black flex items-center justify-center text-[10px]">
            Fx
          </div>
          <span className="font-semibold text-neutral-300">Fixio Engine</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-500">28+ Tools Ready</span>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="hover:text-white transition cursor-pointer"
            >
              {language === "id" ? "Pengaturan" : "Settings"}
            </button>
          )}
          <a
            href="https://api.nexadev.my.id"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
};
