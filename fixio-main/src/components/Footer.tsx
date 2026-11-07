import React from "react";
import { Settings, BookOpen } from "lucide-react";
import { Logo } from "./Logo";

interface FooterProps {
  onOpenSettings?: () => void;
  language?: "id" | "en";
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings, language = "en" }) => {
  return (
    <footer className="mt-auto border-t-[3px] border-[var(--bru-line)] bg-[var(--bru-bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
        <Logo size="xs" />

        <div className="flex items-center gap-2">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="bru-btn px-3 py-2 text-xs"
              aria-label={language === "id" ? "Pengaturan" : "Settings"}
              title={language === "id" ? "Pengaturan" : "Settings"}
            >
              <Settings className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
          <a
            href="https://api.nexadev.my.id"
            target="_blank"
            rel="noreferrer"
            className="bru-btn px-3 py-2 text-xs"
            aria-label="API"
            title="API"
          >
            <BookOpen className="w-4 h-4" strokeWidth={2.5} />
            <span>API</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
