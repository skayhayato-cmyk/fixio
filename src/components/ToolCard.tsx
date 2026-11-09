import React from "react";
import { motion } from "motion/react";
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

// Harmonious palette: balanced, high-contrast, strictly anti-slop
function getToolBadge(id: string, category: string): { 
  iconBg: string; 
  iconColor: string; 
  badgeColor: string;
  status: string;
} {
  switch (id) {
    case "tiktok-dl":
    case "tiktok-dl-v2":
    case "tiktok-stalker":
      return { 
        iconBg: "bg-cyan-950/40 border border-cyan-800/40", 
        iconColor: "text-cyan-400", 
        badgeColor: "text-cyan-400/90", 
        status: "Tersedia" 
      };
    case "ig-dl":
    case "ig-dl-v2":
    case "ig-stalker":
      return { 
        iconBg: "bg-rose-950/40 border border-rose-800/40", 
        iconColor: "text-rose-400", 
        badgeColor: "text-rose-400/90", 
        status: "Tersedia" 
      };
    case "spotify-dl":
    case "yt-play":
      return { 
        iconBg: "bg-emerald-950/40 border border-emerald-800/40", 
        iconColor: "text-emerald-400", 
        badgeColor: "text-emerald-400/90", 
        status: "Audio HQ" 
      };
    case "qcwa":
      return { 
        iconBg: "bg-emerald-950/40 border border-emerald-800/40", 
        iconColor: "text-emerald-400", 
        badgeColor: "text-emerald-400/90", 
        status: "Stiker WA" 
      };
    case "ff-stalker":
    case "fake-ff":
      return { 
        iconBg: "bg-amber-950/40 border border-amber-800/40", 
        iconColor: "text-amber-400", 
        badgeColor: "text-amber-400/90", 
        status: "Aktif" 
      };
    case "roblox-stalker":
      return { 
        iconBg: "bg-red-950/40 border border-red-800/40", 
        iconColor: "text-red-400", 
        badgeColor: "text-red-400/90", 
        status: "Aktif" 
      };
    case "remini":
    case "wink-hd":
      return { 
        iconBg: "bg-violet-950/40 border border-violet-800/40", 
        iconColor: "text-violet-400", 
        badgeColor: "text-violet-400/90", 
        status: "AI HD" 
      };
    case "remove-bg":
      return { 
        iconBg: "bg-sky-950/40 border border-sky-800/40", 
        iconColor: "text-sky-400", 
        badgeColor: "text-sky-400/90", 
        status: "Transparan" 
      };
    case "info-gempa":
      return { 
        iconBg: "bg-rose-950/40 border border-rose-800/40", 
        iconColor: "text-rose-400", 
        badgeColor: "text-rose-400/90", 
        status: "Live BMKG" 
      };
    case "ss-web":
      return { 
        iconBg: "bg-blue-950/40 border border-blue-800/40", 
        iconColor: "text-blue-400", 
        badgeColor: "text-blue-400/90", 
        status: "3-Viewport" 
      };
    case "to-qr":
      return { 
        iconBg: "bg-neutral-800/80 border border-neutral-700/60", 
        iconColor: "text-neutral-200", 
        badgeColor: "text-neutral-400", 
        status: "Instant" 
      };
    case "auto-trace":
      return { 
        iconBg: "bg-indigo-950/40 border border-indigo-800/40", 
        iconColor: "text-indigo-400", 
        badgeColor: "text-indigo-400/90", 
        status: "Vektor SVG" 
      };
    default:
      if (category === "social") {
        return { 
          iconBg: "bg-pink-950/40 border border-pink-800/40", 
          iconColor: "text-pink-400", 
          badgeColor: "text-pink-400/90", 
          status: "Tersedia" 
        };
      }
      return { 
        iconBg: "bg-amber-950/30 border border-amber-800/30", 
        iconColor: "text-[#ffe600]", 
        badgeColor: "text-neutral-400", 
        status: "Tersedia" 
      };
  }
}

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (id: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const Icon = ICON_MAP[tool.iconName] || Sparkles;
  const style = getToolBadge(tool.id, tool.category);

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15, ease: "easeOut" } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      onClick={() => onSelect(tool.id)}
      className="group bg-[#131317] hover:bg-[#18181e] border border-neutral-800/80 hover:border-neutral-700 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 select-none w-full max-w-full overflow-hidden transition-colors"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Curated Rounded Square Icon container */}
        <div className={`w-10 h-10 rounded-xl ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Clean, readable typography */}
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-100 tracking-tight truncate group-hover:text-white transition-colors">
            {tool.title}
          </h3>
          <p className="text-[11px] font-medium text-neutral-400 truncate mt-0.5">
            {style.status}
          </p>
        </div>
      </div>

      {/* Subtle indicator tag */}
      {tool.badge && (
        <span className="hidden xs:inline-block text-[10px] font-semibold text-neutral-400 bg-neutral-800/60 px-1.5 py-0.5 rounded border border-neutral-700/50 shrink-0">
          {tool.badge}
        </span>
      )}
    </motion.div>
  );
};
