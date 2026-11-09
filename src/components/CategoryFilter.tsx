import React from "react";
import { motion } from "motion/react";
import { ToolCategory } from "../types";
import { 
  Sparkles, 
  Globe, 
  Share2, 
  MessageSquare, 
  Activity, 
  UploadCloud, 
  LayoutGrid 
} from "lucide-react";
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
    { id: "all", label: isEn ? "Semua Layanan" : "Semua Layanan", icon: LayoutGrid },
    { id: "social", label: isEn ? "Media Sosial" : "Media Sosial", icon: Share2 },
    { id: "image", label: isEn ? "Gambar & AI" : "Gambar & AI", icon: Sparkles },
    { id: "meme", label: isEn ? "Quotes & Meme" : "Quotes & Meme", icon: MessageSquare },
    { id: "web", label: isEn ? "Web Tools" : "Web Tools", icon: Globe },
    { id: "info", label: isEn ? "Gempa BMKG" : "Gempa BMKG", icon: Activity },
    { id: "utility", label: isEn ? "Utilitas" : "Utilitas", icon: UploadCloud },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const count = counts[cat.id] || 0;
        const Icon = cat.icon;

        return (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectCategory(cat.id)}
            className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer select-none border ${
              isActive
                ? "bg-white text-black border-white shadow-xs font-bold"
                : "bg-[#141418] text-neutral-400 hover:text-white border-neutral-800/80 hover:border-neutral-700"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-neutral-400"}`} />
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? "bg-black/10 text-black font-bold" : "bg-neutral-800 text-neutral-400"
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
