/**
 * Parse text like "Nature's whisper | Healing, Serenity, Escapism"
 */
export function parseCommand(text = ""): { title: string; tags: string[] } {
  const [t, tg] = text.split("|");
  const tags = tg
    ? tg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5)
    : ["Healing", "Serenity", "Escapism"];
  return { title: (t || "Nature's whisper").trim(), tags };
}

export interface PresetTemplate {
  id: string;
  label: string;
  rawText: string;
  title: string;
  tags: string[];
  author: string;
  sampleVideo: string;
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "nature",
    label: "Nature's Whisper",
    rawText: "Nature's whisper | Healing, Serenity, Escapism",
    title: "Nature's whisper",
    tags: ["Healing", "Serenity", "Escapism"],
    author: "nexadev",
    sampleVideo: "/samples/nature.mp4",
  },
  {
    id: "sunset",
    label: "The Sunset Vibes",
    rawText: "The sunset vibes | Healing, Vitaminsea, Addict",
    title: "The sunset vibes",
    tags: ["Healing", "Vitaminsea", "Addict"],
    author: "nexadev",
    sampleVideo: "/samples/sunset.mp4",
  },
  {
    id: "twilight",
    label: "Urban Twilight",
    rawText: "Urban twilight | Cityscape, Nightlife, Cinematic",
    title: "Urban twilight",
    tags: ["Cityscape", "Nightlife", "Cinematic"],
    author: "nexadev",
    sampleVideo: "/samples/sunset.mp4",
  },
  {
    id: "morning",
    label: "Morning Coffee",
    rawText: "Morning coffee | Mindful, Productivity, Peace",
    title: "Morning coffee",
    tags: ["Mindful", "Productivity", "Peace"],
    author: "nexadev",
    sampleVideo: "/samples/nature.mp4",
  },
];
