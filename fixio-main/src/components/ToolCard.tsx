import React from "react";
import { ToolDefinition } from "../types";
import {
  Sparkles, Scissors, Globe, Instagram, Video, MessageSquare, PhoneCall, Play, Flame,
  MessageCircle, Smartphone, Music, MessageSquareQuote, Activity, UploadCloud, Download,
  FileVideo, DownloadCloud, Music2, Gamepad2, QrCode, Wand2, Shapes, Film, Type, ArrowUpRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sparkles, Scissors, Globe, Instagram, Video, MessageSquare, PhoneCall, Play, Flame,
  MessageCircle, Smartphone, Music, MessageSquareQuote, Activity, UploadCloud, Download,
  FileVideo, DownloadCloud, Music2, Gamepad2, QrCode, Wand2, Shapes, Film, Type,
};

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (id: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const Icon = ICON_MAP[tool.iconName] || Sparkles;

  return (
    <button
      type="button"
      onClick={() => onSelect(tool.id)}
      className="bru-card group w-full text-left p-3.5 flex items-center gap-3.5 cursor-pointer"
    >
      <span className="bru-icon w-12 h-12 shrink-0">
        <Icon className="w-6 h-6" strokeWidth={2.5} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold leading-tight truncate">
          {tool.title}
        </span>
        {tool.badge && (
          <span className="inline-block mt-1.5 text-[11px] font-bold px-1.5 py-0.5 border-2 border-[var(--bru-line)]">
            {tool.badge}
          </span>
        )}
      </span>

      <ArrowUpRight
        className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={2.5}
      />
    </button>
  );
};
