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

function getToolBadge(id: string, category: string): { 
  iconBg: string; 
  iconColor: string; 
  status: string;
} {
  switch (id) {
    case "tiktok-dl":
    case "tiktok-dl-v2":
    case "tiktok-stalker":
      return { 
        iconBg: "bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/70 dark:border-cyan-800/40", 
        iconColor: "text-cyan-600 dark:text-cyan-400", 
        status: "Tersedia" 
      };
    case "ig-dl":
    case "ig-dl-v2":
    case "ig-stalker":
      return { 
        iconBg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/40", 
        iconColor: "text-rose-600 dark:text-rose-400", 
        status: "Tersedia" 
      };
    case "spotify-dl":
    case "yt-play":
      return { 
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40", 
        iconColor: "text-emerald-600 dark:text-emerald-400", 
        status: "Audio HQ" 
      };
    case "qcwa":
      return { 
        iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40", 
        iconColor: "text-emerald-600 dark:text-emerald-400", 
        status: "Stiker WA" 
      };
    case "ff-stalker":
    case "fake-ff":
      return { 
        iconBg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/40", 
        iconColor: "text-amber-600 dark:text-amber-400", 
        status: "Aktif" 
      };
    case "roblox-stalker":
      return { 
        iconBg: "bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/40", 
        iconColor: "text-red-600 dark:text-red-400", 
        status: "Aktif" 
      };
    case "remini":
    case "wink-hd":
      return { 
        iconBg: "bg-violet-50 dark:bg-violet-950/40 border border-violet-200/70 dark:border-violet-800/40", 
        iconColor: "text-violet-600 dark:text-violet-400", 
        status: "AI HD" 
      };
    case "remove-bg":
      return { 
        iconBg: "bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/40", 
        iconColor: "text-sky-600 dark:text-sky-400", 
        status: "Transparan" 
      };
    case "info-gempa":
      return { 
        iconBg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/40", 
        iconColor: "text-rose-600 dark:text-rose-400", 
        status: "Live BMKG" 
      };
    case "ss-web":
      return { 
        iconBg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/40", 
        iconColor: "text-blue-600 dark:text-blue-400", 
        status: "3-Viewport" 
      };
    case "to-qr":
      return { 
        iconBg: "bg-zinc-100 dark:bg-neutral-800/80 border border-zinc-200 dark:border-neutral-700/60", 
        iconColor: "text-zinc-700 dark:text-neutral-200", 
        status: "Instant" 
      };
    case "auto-trace":
      return { 
        iconBg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40", 
        iconColor: "text-indigo-600 dark:text-indigo-400", 
        status: "Vektor SVG" 
      };
    default:
      if (category === "social") {
        return { 
          iconBg: "bg-pink-50 dark:bg-pink-950/40 border border-pink-200/70 dark:border-pink-800/40", 
          iconColor: "text-pink-600 dark:text-pink-400", 
          status: "Tersedia" 
        };
      }
      return { 
        iconBg: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/30", 
        iconColor: "text-amber-600 dark:text-amber-400", 
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
      whileHover={{ y: -2, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      onClick={() => onSelect(tool.id)}
      className="group bg-white dark:bg-[#131317] hover:bg-zinc-50/80 dark:hover:bg-[#18181e] border border-zinc-200/90 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.18] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)] p-3 sm:p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 select-none w-full max-w-full overflow-hidden transition-all duration-150"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Curated Rounded Square Icon container */}
        <div className={`w-10 h-10 rounded-xl ${style.iconBg} ${style.iconColor} flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Clean, readable typography */}
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-black dark:group-hover:text-white transition-colors duration-150">
            {tool.title}
          </h3>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {style.status}
          </p>
        </div>
      </div>

      {/* Subtle indicator tag */}
      {tool.badge && (
        <span className="hidden xs:inline-block text-[10px] font-semibold text-zinc-600 dark:text-neutral-400 bg-zinc-100 dark:bg-neutral-800/60 px-1.5 py-0.5 rounded border border-zinc-200/80 dark:border-neutral-700/50 shrink-0">
          {tool.badge}
        </span>
      )}
    </motion.div>
  );
};
