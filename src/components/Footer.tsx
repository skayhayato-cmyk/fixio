import React from "react";
import { Logo } from "./Logo";

interface FooterProps {
  onOpenSettings?: () => void;
  language?: "id" | "en";
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings, language = "en" }) => {
  return (
    <footer className="mt-auto py-8 px-4 border-t border-black/5 dark:border-white/10 text-center text-xs text-[#8e8e93] dark:text-[#98989d]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo size="sm" className="h-5" />
          <span>•</span>
          <span>By Nexa</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              {language === "id" ? "Pengaturan" : "Settings"}
            </button>
          )}
          <a
            href="https://api.nexadev.my.id"
            target="_blank"
            rel="noreferrer"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
};
