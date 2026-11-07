import React from "react";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

// URL lama dipertahankan karena dipakai file lain (mis. ikon PWA / metadata).
export const LOGO_URL = "https://c.termai.cc/i134/82ohU00.png";

const SIZES = {
  xs: { box: "w-5 h-5 text-xs", text: "text-sm" },
  sm: { box: "w-8 h-8 text-base", text: "text-lg" },
  md: { box: "w-10 h-10 text-xl", text: "text-2xl" },
  lg: { box: "w-14 h-14 text-3xl", text: "text-4xl" },
  xl: { box: "w-20 h-20 text-5xl", text: "text-6xl" },
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  className = "",
  animate = false,
  onClick,
}) => {
  const s = SIZES[size] || SIZES.md;
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${animate ? "animate-ios-fade" : ""} ${className}`}
    >
      <span
        className={`${s.box} bru-title flex items-center justify-center bg-[var(--bru-ink)] text-[var(--bru-bg)] border-2 border-[var(--bru-ink)] leading-none`}
        aria-hidden="true"
      >
        F
      </span>
      <span className={`${s.text} bru-title leading-none`}>Fixio</span>
    </div>
  );
};
