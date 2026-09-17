export type ToolCategory = 
  | 'all' 
  | 'image' 
  | 'social' 
  | 'meme' 
  | 'web' 
  | 'info' 
  | 'utility';

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  tag?: string;
  badge?: string;
  popular?: boolean;
}

export interface UploadResult {
  status: boolean;
  path?: string;
  mimetype?: string;
  size?: number;
  message?: string;
}

export interface WinkResponse {
  statusCode: number;
  author: string;
  status: boolean;
  resultUrl?: string;
  result?: string;
  url?: string;
  timestamp?: string;
  message?: string;
}

export interface SsWebResponse {
  author: string;
  status: boolean;
  data?: {
    url: string;
  };
  message?: string;
}

export interface InstagramStalkerResponse {
  author: string;
  status: boolean;
  data?: {
    id: string;
    photo: string;
    username: string;
    name: string;
    posts: number;
    followers: number;
    following: number;
    likes: number;
    verified: boolean;
    private: boolean;
    bio: string;
  };
  message?: string;
}

export interface TikTokStalkerResponse {
  author: string;
  status: boolean;
  data?: {
    id: string;
    photo: string;
    username: string;
    name: string;
    posts: number;
    followers: number;
    following: number;
    likes: number;
    verified: boolean;
    private: boolean;
    bio: string;
  };
  message?: string;
}

export interface EarthquakeData {
  date: string;
  time: string;
  datetime: string;
  coordinates: {
    latitude: number;
    longitude: number;
    latitude_string: string;
    longitude_string: string;
  };
  magnitude: number | string;
  depth: string;
  location: string;
  potential: string;
  felt: string;
  shakemap?: string;
  shakemap_url?: string;
  map_url?: string;
}

export interface GempaResponse {
  status: string;
  author: string;
  timestamp: string;
  type: string;
  title: string;
  earthquake?: EarthquakeData;
  message?: string;
}

/* ==================== Downloader Tools ==================== */

export interface TikTokDownloadResponse {
  author: string;
  status: boolean;
  data?: {
    video?: string | null;
    videoHD?: string | null;
    audio?: string | null;
    photo?: string[] | string | null;
  };
  message?: string;
}

export interface TikTokDownloadV2Response {
  author: string;
  service: string;
  ok: boolean;
  url: string;
  caption?: string;
  mp4?: string;
  mp3?: string;
  hd?: string;
  download?: string | null;
  message?: string;
}

export interface InstagramDownloadItem {
  type: string;
  url: string;
}

export interface InstagramDownloadResponse {
  author: string;
  status: boolean;
  data?: InstagramDownloadItem[];
  message?: string;
}

export interface InstagramMediaItem {
  type: string;
  url: string;
  filename?: string | null;
  source?: string;
}

export interface InstagramDownloadV2Response {
  author: string;
  service: string;
  ok: boolean;
  url: string;
  status: number;
  meta?: {
    author?: string;
    caption?: string | null;
    views?: number | null;
    likes?: number | null;
    duration?: number | null;
  };
  media?: {
    video?: InstagramMediaItem[];
    image?: InstagramMediaItem[];
    audio?: InstagramMediaItem[];
    other?: InstagramMediaItem[];
  };
  message?: string;
}

export interface SpotifyTrack {
  index: number;
  name: string;
  artist: string;
  cover?: string;
  album?: string;
  duration?: string;
  year?: number;
  mp3_url?: string;
}

export interface SpotifyDownloadResponse {
  author: string;
  service: string;
  ok: boolean;
  url: string;
  total?: number;
  downloaded?: number;
  tracks?: SpotifyTrack[];
  message?: string;
}
