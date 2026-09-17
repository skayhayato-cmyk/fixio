import React from "react";
import { ToolCategory } from "../types";
import { Sparkles, Scissors, Globe, Instagram, MessageSquare, Activity, UploadCloud, Grid } from "lucide-react";
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

  const categories: { id: ToolCategory; label: string; icon: any }[] = [
    { id: "all", label: isEn ? "All" : "Semua", icon: Grid },
    { id: "image", label: isEn ? "Image & AI" : "Gambar & AI", icon: Sparkles },
    { id: "social", label: isEn ? "Social" : "Sosial", icon: Instagram },
    { id: "meme", label: isEn ? "Quotes & Meme" : "Quotes & Meme", icon: MessageSquare },
    { id: "web", label: isEn ? "Web" : "Web", icon: Globe },
    { id: "info", label: isEn ? "Earthquake" : "Gempa BMKG", icon: Activity },
    { id: "utility", label: isEn ? "Utility" : "Utilitas", icon: UploadCloud },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const count = counts[cat.id] || 0;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer select-none ${
              isActive
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "bg-black/5 dark:bg-white/10 text-[#8e8e93] dark:text-[#aeaeb2] hover:text-black dark:hover:text-white"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] ${
                isActive ? "opacity-60" : "opacity-40"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
