import React from "react";
import { Logo } from "./Logo";

interface FooterProps {
  onOpenSettings?: () => void;
  language?: "id" | "en";
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings, language = "en" }) => {
  return (
    <footer className="mt-auto py-6 px-4 bg-[#f4f4f0] dark:bg-[#0d0d0f] border-t-3 border-[#0a0a0a] dark:border-[#f5f5f0] text-center text-xs font-bold text-[#0a0a0a] dark:text-[#f5f5f0]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" className="h-5" />
          <span>•</span>
          <span className="uppercase tracking-wider">Crafted by Nexa Engine</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-extrabold uppercase">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="hover:bg-[#ffe600] hover:text-black px-2 py-1 border border-[#0a0a0a] dark:border-[#f5f5f0] transition-colors cursor-pointer"
            >
              {language === "id" ? "Pengaturan" : "Settings"}
            </button>
          )}
          <a
            href="https://api.nexadev.my.id"
            target="_blank"
            rel="noreferrer"
            className="hover:bg-[#ffe600] hover:text-black px-2 py-1 border border-[#0a0a0a] dark:border-[#f5f5f0] transition-colors"
          >
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
};
