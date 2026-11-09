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
  Share2,
  Film,
  Type
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
  Share2,
  Film,
  Type
};

// Brand-authentic squircle styling (matching Zireku & modern fintech dashboards)
function getToolBrandStyle(id: string): { 
  badgeBg: string; 
  iconColor: string; 
  title: string;
} {
  switch (id) {
    case "tiktok-dl":
    case "tiktok-dl-v2":
      return { 
        badgeBg: "bg-black text-cyan-400 border border-white/10 dark:border-white/15", 
        iconColor: "text-cyan-400", 
        title: "TikTok Downloader" 
      };
    case "tiktok-stalker":
      return { 
        badgeBg: "bg-black text-pink-500 border border-white/10 dark:border-white/15", 
        iconColor: "text-pink-500", 
        title: "TikTok Stalker" 
      };
    case "ig-dl":
    case "ig-dl-v2":
      return { 
        badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white", 
        iconColor: "text-white", 
        title: "Instagram Downloader" 
      };
    case "ig-stalker":
      return { 
        badgeBg: "bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-500 text-white", 
        iconColor: "text-white", 
        title: "Instagram Stalker" 
      };
    case "spotify-dl":
      return { 
        badgeBg: "bg-[#1DB954] text-black", 
        iconColor: "text-black", 
        title: "Spotify MP3" 
      };
    case "yt-play":
      return { 
        badgeBg: "bg-[#FF0000] text-white", 
        iconColor: "text-white", 
        title: "YouTube Music" 
      };
    case "qcwa":
    case "fake-call":
      return { 
        badgeBg: "bg-[#25D366] text-white", 
        iconColor: "text-white", 
        title: id === "qcwa" ? "WhatsApp Quote" : "WhatsApp Call" 
      };
    case "remini":
      return { 
        badgeBg: "bg-violet-600 text-white", 
        iconColor: "text-white", 
        title: "Remini AI HD" 
      };
    case "wink-hd":
      return { 
        badgeBg: "bg-indigo-600 text-white", 
        iconColor: "text-white", 
        title: "Wink HD Enhancer" 
      };
    case "remove-bg":
      return { 
        badgeBg: "bg-sky-500 text-white", 
        iconColor: "text-white", 
        title: "Remove Background" 
      };
    case "ff-stalker":
    case "fake-ff":
      return { 
        badgeBg: "bg-amber-500 text-black", 
        iconColor: "text-black", 
        title: id === "ff-stalker" ? "Free Fire Stalker" : "Free Fire Lobby" 
      };
    case "roblox-stalker":
      return { 
        badgeBg: "bg-neutral-800 text-red-500 border border-neutral-700", 
        iconColor: "text-red-500", 
        title: "Roblox Stalker" 
      };
    case "info-gempa":
      return { 
        badgeBg: "bg-rose-600 text-white", 
        iconColor: "text-white", 
        title: "Gempa BMKG" 
      };
    case "ss-web":
      return { 
        badgeBg: "bg-blue-600 text-white", 
        iconColor: "text-white", 
        title: "Web Screenshot" 
      };
    case "auto-trace":
      return { 
        badgeBg: "bg-teal-600 text-white", 
        iconColor: "text-white", 
        title: "Image to SVG" 
      };
    case "imgtopromt":
      return { 
        badgeBg: "bg-purple-600 text-white", 
        iconColor: "text-white", 
        title: "Image to Prompt" 
      };
    case "to-qr":
      return { 
        badgeBg: "bg-slate-700 text-white", 
        iconColor: "text-white", 
        title: "QR Generator" 
      };
    case "uploader":
      return { 
        badgeBg: "bg-emerald-600 text-white", 
        iconColor: "text-white", 
        title: "CDN Uploader" 
      };
    case "ampreset":
      return { 
        badgeBg: "bg-fuchsia-600 text-white", 
        iconColor: "text-white", 
        title: "Alight Motion" 
      };
    case "story-edit":
    case "bratvid":
      return { 
        badgeBg: "bg-lime-500 text-black", 
        iconColor: "text-black", 
        title: id === "bratvid" ? "Brat Video" : "Story Typography" 
      };
    default:
      return { 
        badgeBg: "bg-zinc-800 text-white border border-zinc-700", 
        iconColor: "text-white", 
        title: "" 
      };
  }
}

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (id: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const Icon = ICON_MAP[tool.iconName] || Sparkles;
  const brand = getToolBrandStyle(tool.id);
  const displayTitle = brand.title || tool.title;

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      onClick={() => onSelect(tool.id)}
      className="group w-full text-left bg-white dark:bg-[#141416] hover:bg-zinc-50 dark:hover:bg-[#19191d] border border-zinc-200/90 dark:border-white/[0.07] hover:border-zinc-300 dark:hover:border-white/[0.16] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] p-3 sm:p-3.5 rounded-2xl cursor-pointer flex items-center gap-3 select-none transition-colors duration-150 relative overflow-hidden"
    >
      {/* Brand Icon Squircle (Exact match with screenshot) */}
      <div className={`w-10 h-10 sm:w-10.5 sm:h-10.5 rounded-xl ${brand.badgeBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}>
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>

      {/* Clean, unboxed text hierarchy */}
      <div className="min-w-0 flex-1">
        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-amber-600 dark:group-hover:text-white transition-colors duration-150">
          {displayTitle}
        </h3>
        <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 mt-0.5 tracking-normal">
          Tersedia
        </p>
      </div>
    </motion.button>
  );
};
