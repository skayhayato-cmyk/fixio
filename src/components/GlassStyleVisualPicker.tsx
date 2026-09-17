import React from "react";
import { Check, Sparkles, Droplets, Layers, ShieldCheck } from "lucide-react";
import { GlassStyle } from "../services/useAppSettings";

interface GlassStyleVisualPickerProps {
  selectedStyle: GlassStyle;
  onSelect: (style: GlassStyle) => void;
  smooth3D?: boolean;
  language?: "id" | "en";
}

export const GlassStyleVisualPicker: React.FC<GlassStyleVisualPickerProps> = ({
  selectedStyle,
  onSelect,
  smooth3D = true,
  language = "en",
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Visual Ambient Container matching mockup */}
      <div className="relative w-full rounded-3xl p-3 sm:p-4.5 overflow-hidden border border-black/10 dark:border-white/15 bg-gradient-to-br from-slate-900 via-[#121826] to-[#0a0e17] shadow-xl">
        {/* Ambient artistic backdrop blobs for authentic glass refraction preview */}
        <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-blue-500/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-10 w-48 h-48 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

        {/* Ambient grid texture */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
            backgroundSize: "16px 16px"
          }}
        />

        <div className="relative z-10 flex flex-col gap-3">
          {/* TOP CARD: Frosted (Concept) - Full Width */}
          <button
            type="button"
            id="glass-picker-frosted"
            onClick={() => onSelect("frosted")}
            className={`group relative w-full text-left p-4 sm:p-5 rounded-2xl transition-all cursor-pointer select-none overflow-hidden ${
              smooth3D ? "glass-picker-card" : ""
            } ${
              selectedStyle === "frosted"
                ? "ring-2 ring-white/90 shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                : "hover:border-white/40 border border-white/20"
            }`}
            style={{
              background: "rgba(255, 255, 255, 0.22)",
              backdropFilter: "blur(38px) saturate(160%)",
              WebkitBackdropFilter: "blur(38px) saturate(160%)",
              boxShadow: selectedStyle === "frosted"
                ? "inset 0 1px 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.2), 0 12px 32px rgba(0, 0, 0, 0.45)"
                : "inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Top specular highlight rim */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                  Frosted
                </h3>
                <p className="text-sm sm:text-base font-medium text-white/80 mt-0.5 tracking-wide">
                  Concept
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Satin Heavy
                </span>

                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  selectedStyle === "frosted"
                    ? "bg-white text-black shadow-lg scale-105"
                    : "border-2 border-white/40 text-transparent group-hover:border-white/70"
                }`}>
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </div>
          </button>

          {/* BOTTOM ROW: 2 Cards (Clear iOS & Blur One UI) */}
          <div className="grid grid-cols-2 gap-3">
            {/* LEFT CARD: Clear (iOS) */}
            <button
              type="button"
              id="glass-picker-clear"
              onClick={() => onSelect("clear")}
              className={`group relative text-left p-4 sm:p-5 rounded-2xl transition-all cursor-pointer select-none overflow-hidden ${
                smooth3D ? "glass-picker-card" : ""
              } ${
                selectedStyle === "clear"
                  ? "ring-2 ring-white/90 shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                  : "hover:border-white/40 border border-white/20"
              }`}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(18px) saturate(200%)",
                WebkitBackdropFilter: "blur(18px) saturate(200%)",
                boxShadow: selectedStyle === "clear"
                  ? "inset 0 1px 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.15), 0 12px 32px rgba(0, 0, 0, 0.4)"
                  : "inset 0 1px 1px 0 rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Specular edge */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                    Clear
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-white/80 mt-0.5 tracking-wide">
                    iOS
                  </p>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  selectedStyle === "clear"
                    ? "bg-white text-black shadow-lg scale-105"
                    : "border-2 border-white/40 text-transparent group-hover:border-white/70"
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </button>

            {/* RIGHT CARD: Blur (One UI) */}
            <button
              type="button"
              id="glass-picker-blur"
              onClick={() => onSelect("blur")}
              className={`group relative text-left p-4 sm:p-5 rounded-2xl transition-all cursor-pointer select-none overflow-hidden ${
                smooth3D ? "glass-picker-card" : ""
              } ${
                selectedStyle === "blur"
                  ? "ring-2 ring-white/90 shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                  : "hover:border-white/40 border border-white/20"
              }`}
              style={{
                background: "rgba(230, 230, 240, 0.26)",
                backdropFilter: "blur(48px) saturate(130%)",
                WebkitBackdropFilter: "blur(48px) saturate(130%)",
                boxShadow: selectedStyle === "blur"
                  ? "inset 0 1px 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.2), 0 12px 32px rgba(0, 0, 0, 0.4)"
                  : "inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), 0 4px 16px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Specular edge */}
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                    Blur
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-white/80 mt-0.5 tracking-wide">
                    One UI
                  </p>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  selectedStyle === "blur"
                    ? "bg-white text-black shadow-lg scale-105"
                    : "border-2 border-white/40 text-transparent group-hover:border-white/70"
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </button>
          </div>

          {/* SOLID FLAT ALTERNATIVE PILL */}
          <button
            type="button"
            id="glass-picker-flat"
            onClick={() => onSelect("flat")}
            className={`w-full py-2 px-3 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium transition-all ${
              selectedStyle === "flat"
                ? "bg-white text-black font-semibold shadow-md"
                : "bg-white/10 hover:bg-white/15 text-white/80 border border-white/10"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {language === "id" ? "Solid Flat (Tanpa Kaca / Classic Opaque)" : "Solid Flat (No Glass / Classic Opaque)"}
            </span>
            {selectedStyle === "flat" && (
              <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full font-bold">
                {language === "id" ? "Aktif" : "Active"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
