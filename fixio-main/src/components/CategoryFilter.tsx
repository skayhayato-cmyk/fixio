import React from "react";
import { ToolCategory } from "../types";
import { LayoutGrid, Sparkles, Share2, Laugh, Globe, Activity, Wrench } from "lucide-react";
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
    { id: "all", label: isEn ? "All" : "Semua", icon: LayoutGrid },
    { id: "image", label: isEn ? "Image" : "Gambar", icon: Sparkles },
    { id: "social", label: isEn ? "Social" : "Sosial", icon: Share2 },
    { id: "meme", label: "Meme", icon: Laugh },
    { id: "web", label: "Web", icon: Globe },
    { id: "info", label: isEn ? "Quake" : "Gempa", icon: Activity },
    { id: "utility", label: isEn ? "Utility" : "Utilitas", icon: Wrench },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-1 pb-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            data-active={isActive}
            aria-pressed={isActive}
            className="bru-chip px-3 py-2 text-xs flex items-center gap-2 shrink-0 cursor-pointer select-none"
          >
            <Icon className="w-4 h-4" strokeWidth={2.5} />
            <span>{cat.label}</span>
            <span className="tabular-nums text-[11px] px-1.5 bg-[var(--bru-ink)] text-[var(--bru-bg)]">
              {counts[cat.id] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};
