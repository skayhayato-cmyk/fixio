import React from "react";
import { motion } from "motion/react";
import { ToolCategory } from "../types";
import { AppSettings } from "../services/useAppSettings";

interface CategoryFilterProps {
  activeCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
  counts: Record<ToolCategory, number>;
  settings?: AppSettings;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  counts,
  settings,
}) => {
  const isEn = settings?.language === "en";

  const categories: { id: ToolCategory; label: string }[] = [
    { id: "all", label: isEn ? "Semua Layanan" : "Semua" },
    { id: "social", label: isEn ? "Social Media" : "Media Sosial" },
    { id: "image", label: isEn ? "Photo & AI" : "AI & Foto" },
    { id: "meme", label: isEn ? "Quotes & Meme" : "Quotes & Meme" },
    { id: "web", label: isEn ? "Web Tools" : "Web Tools" },
    { id: "info", label: isEn ? "BMKG Gempa" : "Gempa BMKG" },
    { id: "utility", label: isEn ? "Utilities" : "Utilitas" },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const count = counts[cat.id] || 0;

        return (
          <motion.button
            key={cat.id}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectCategory(cat.id)}
            className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer select-none border ${
              isActive
                ? "text-zinc-950 dark:text-white border-transparent"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white/70 dark:bg-[#141416] border-zinc-200/80 dark:border-white/[0.08]"
            }`}
          >
            {/* Animated Pill Background */}
            {isActive && (
              <motion.div
                layoutId="activeCategoryPill"
                className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}

            <span className={`relative z-10 ${isActive ? "text-white dark:text-zinc-950 font-bold" : ""}`}>
              {cat.label}
            </span>

            <span
              className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive 
                  ? "bg-white/20 dark:bg-black/15 text-white dark:text-zinc-950 font-bold" 
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
