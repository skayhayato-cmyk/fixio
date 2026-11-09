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
    { id: "all", label: isEn ? "All Tools" : "Semua Alat", icon: Grid },
    { id: "image", label: isEn ? "Image & AI" : "Gambar & AI", icon: Sparkles },
    { id: "social", label: isEn ? "Social Media" : "Media Sosial", icon: Instagram },
    { id: "meme", label: isEn ? "Quotes & Meme" : "Quotes & Meme", icon: MessageSquare },
    { id: "web", label: isEn ? "Web Tools" : "Alat Web", icon: Globe },
    { id: "info", label: isEn ? "Earthquake" : "Gempa BMKG", icon: Activity },
    { id: "utility", label: isEn ? "Utility" : "Utilitas", icon: UploadCloud },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const count = counts[cat.id] || 0;
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 border-2 border-[#0a0a0a] dark:border-[#f5f5f0] text-xs font-black uppercase transition-all duration-100 flex items-center gap-1.5 shrink-0 cursor-pointer select-none ${
              isActive
                ? "bg-[#ffe600] text-black shadow-[2px_2px_0px_0px_#0a0a0a] dark:shadow-[2px_2px_0px_0px_#f5f5f0] translate-x-[-1px] translate-y-[-1px]"
                : "bg-white dark:bg-[#17171a] text-[#0a0a0a] dark:text-[#f5f5f0] hover:bg-[#ffe600] hover:text-black hover:shadow-[2px_2px_0px_0px_#0a0a0a]"
            }`}
          >
            <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1 py-0.2 border border-[#0a0a0a] ${
                isActive ? "bg-black text-[#ffe600]" : "bg-[#f4f4f0] text-black dark:bg-[#222226] dark:text-white"
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
