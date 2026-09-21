import React from "react";
import { ToolDefinition } from "../types";
import { 
  Sparkles, 
  Scissors, 
  Globe, 
  Instagram, 
  Video, 
  MessageSquare, 
  PhoneCall, 
  Play, 
  Flame, 
  MessageCircle, 
  Smartphone, 
  Music, 
  MessageSquareQuote, 
  Activity, 
  UploadCloud, 
  ChevronRight,
  Download,
  FileVideo,
  DownloadCloud,
  Music2,
  Gamepad2,
  QrCode
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Sparkles,
  Scissors,
  Globe,
  Instagram,
  Video,
  MessageSquare,
  PhoneCall,
  Play,
  Flame,
  MessageCircle,
  Smartphone,
  Music,
  MessageSquareQuote,
  Activity,
  UploadCloud,
  Download,
  FileVideo,
  DownloadCloud,
  Music2,
  Gamepad2,
  QrCode,
};

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (id: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const Icon = ICON_MAP[tool.iconName] || Sparkles;

  return (
    <div
      onClick={() => onSelect(tool.id)}
      className="group ios-glass-surface p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs hover:border-[#007aff]/30 dark:hover:border-white/25 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 active:scale-[0.985]"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 text-black dark:text-white flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-black dark:text-white tracking-tight truncate">
              {tool.title}
            </h3>
            {tool.badge && (
              <span className="text-[10px] font-medium text-[#8e8e93] dark:text-[#98989d] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md shrink-0">
                {tool.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8e8e93] dark:text-[#98989d] line-clamp-1 mt-0.5">
            {tool.description}
          </p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#c7c7cc] dark:text-[#48484a] group-hover:text-black dark:group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-all" />
    </div>
  );
};
