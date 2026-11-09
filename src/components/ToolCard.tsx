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
  Download, 
  FileVideo, 
  DownloadCloud, 
  Music2, 
  Gamepad2, 
  QrCode, 
  Wand2,
  Shapes,
  Share2
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
  Shapes,
  Share2
};

// Distinctive brand color styling matching Screenshot_20261108-051355_7dae6052.jpg
function getToolStyle(id: string, category: string): { bg: string; text: string; status: string } {
  switch (id) {
    case "tiktok-dl":
    case "tiktok-dl-v2":
    case "tiktok-stalker":
      return { bg: "bg-neutral-900 border border-neutral-700", text: "text-cyan-400", status: "Tersedia" };
    case "ig-dl":
    case "ig-dl-v2":
    case "ig-stalker":
      return { bg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600", text: "text-white", status: "Tersedia" };
    case "spotify-dl":
    case "yt-play":
      return { bg: "bg-emerald-600/20 border border-emerald-500/40", text: "text-emerald-400", status: "Tersedia" };
    case "qcwa":
      return { bg: "bg-emerald-600 text-white", text: "text-white", status: "Tersedia" };
    case "ff-stalker":
    case "fake-ff":
      return { bg: "bg-amber-500/20 border border-amber-500/40", text: "text-amber-400", status: "Aktif" };
    case "roblox-stalker":
      return { bg: "bg-rose-600/20 border border-rose-500/40", text: "text-rose-400", status: "Aktif" };
    case "remini":
    case "wink-hd":
      return { bg: "bg-purple-600/20 border border-purple-500/40", text: "text-purple-400", status: "AI HD" };
    case "remove-bg":
      return { bg: "bg-blue-600/20 border border-blue-500/40", text: "text-blue-400", status: "Transparan" };
    case "info-gempa":
      return { bg: "bg-rose-600 text-white", text: "text-white", status: "Live BMKG" };
    case "ss-web":
      return { bg: "bg-sky-600/20 border border-sky-500/40", text: "text-sky-400", status: "Multi-View" };
    case "to-qr":
      return { bg: "bg-neutral-800 text-neutral-100", text: "text-neutral-200", status: "Instant" };
    case "auto-trace":
      return { bg: "bg-indigo-600/20 border border-indigo-500/40", text: "text-indigo-400", status: "Vector" };
    default:
      if (category === "social") return { bg: "bg-pink-600/20 border border-pink-500/40", text: "text-pink-400", status: "Tersedia" };
      if (category === "image") return { bg: "bg-purple-600/20 border border-purple-500/40", text: "text-purple-400", status: "Tersedia" };
      if (category === "info") return { bg: "bg-amber-600/20 border border-amber-500/40", text: "text-amber-400", status: "Tersedia" };
      return { bg: "bg-neutral-800 border border-neutral-700", text: "text-[#ffe600]", status: "Tersedia" };
  }
}

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (id: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const Icon = ICON_MAP[tool.iconName] || Sparkles;
  const style = getToolStyle(tool.id, tool.category);

  return (
    <div
      onClick={() => onSelect(tool.id)}
      className="group tool-card-interactive bg-[#151519] hover:bg-[#1c1c22] border border-neutral-800/80 hover:border-neutral-700/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 select-none w-full max-w-full overflow-hidden"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Rounded square icon container (like in screenshot) */}
        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Clean, un-cluttered typography */}
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate group-hover:text-neutral-100">
            {tool.title}
          </h3>
          <p className="text-[11px] font-medium text-neutral-400 truncate mt-0.5">
            {style.status}
          </p>
        </div>
      </div>

      {/* Mini badge / chevron indicator */}
      {tool.badge && (
        <span className="hidden xs:inline-block text-[10px] font-semibold text-neutral-400 bg-neutral-800/60 px-1.5 py-0.5 rounded border border-neutral-700/40 shrink-0">
          {tool.badge}
        </span>
      )}
    </div>
  );
};
