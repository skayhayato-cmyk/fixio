import React from "react";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

// Hosted on c.termai.cc (Nexadev's own CDN). The service worker already
// caches responses from this host on first load, so the logo still
// renders offline after the initial visit.
export const LOGO_URL = "https://c.termai.cc/i134/82ohU00.png";

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  className = "",
  animate = false,
  onClick,
}) => {
  const sizeClasses = {
    xs: "h-5 max-w-[80px]",
    sm: "h-7 max-w-[110px]",
    md: "h-8 sm:h-9 max-w-[140px]",
    lg: "h-14 max-w-[200px]",
    xl: "h-16 sm:h-20 max-w-[260px]",
  };

  const imgClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${
        onClick ? "cursor-pointer active:opacity-75 transition-opacity" : ""
      } ${className}`}
    >
      <img
        src={LOGO_URL}
        alt="Fixio"
        className={`${imgClass} w-auto object-contain transition-transform duration-200 ${
          animate ? "animate-ios-fade" : ""
        }`}
        loading="eager"
      />
    </div>
  );
};
