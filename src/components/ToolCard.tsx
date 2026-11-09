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
  QrCode,
  Wand2
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
  Wand2,
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
      className="group bg-white dark:bg-[#17171a] p-4 sm:p-5 border-2 border-[#0a0a0a] dark:border-[#f5f5f0] shadow-[3px_3px_0px_0px_#0a0a0a] dark:shadow-[3px_3px_0px_0px_#ffe600] hover:bg-[#fffde6] dark:hover:bg-[#1f1f24] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#0a0a0a] dark:hover:shadow-[5px_5px_0px_0px_#ffe600] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#0a0a0a] transition-all duration-100 cursor-pointer flex items-center justify-between gap-4 select-none"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 bg-[#ffe600] text-black border-2 border-[#0a0a0a] dark:border-[#0a0a0a] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#0a0a0a] group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#0a0a0a] dark:text-[#f5f5f0] tracking-tight truncate uppercase">
              {tool.title}
            </h3>
            {tool.badge && (
              <span className="text-[10px] font-black uppercase text-black bg-[#ffe600] border border-[#0a0a0a] px-1.5 py-0.5 shrink-0">
                {tool.badge}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#555550] dark:text-[#9e9e98] line-clamp-1 mt-0.5">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="w-7 h-7 bg-white dark:bg-[#222226] border-2 border-[#0a0a0a] dark:border-[#f5f5f0] flex items-center justify-center shrink-0 group-hover:bg-[#ffe600] group-hover:text-black transition-colors">
        <ChevronRight className="w-4 h-4 text-black dark:text-white group-hover:text-black group-hover:translate-x-0.5 transition-transform stroke-[3]" />
      </div>
    </div>
  );
};
