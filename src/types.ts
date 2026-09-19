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

/* ==================== Stalker FF & Roblox ==================== */

export interface FFRankBr {
  points?: number;
  tier?: string;
  image?: string;
  imageUrl?: string;
  pointsText?: string;
  rankId?: number;
  maxRank?: number;
  showInProfile?: boolean;
}

export interface FFRankCs {
  tier?: string;
  star?: number;
  image?: string;
  points?: number;
  rankId?: number;
  maxRank?: number;
  showInProfile?: boolean;
}

export interface FFProfile {
  uid: string;
  nickname: string;
  level: number;
  exp: number;
  region: string;
  server: string;
  releaseVersion?: string;
  seasonId?: number;
  role?: string | null;
  accountType?: number;
  likes?: number;
  likesText?: string;
  prime?: {
    level?: number;
    image?: string;
  };
  verified?: string | null;
  ranks?: {
    br?: FFRankBr;
    cs?: FFRankCs;
  };
  booyahPass?: {
    active?: boolean;
    text?: string;
  };
  creditScore?: {
    value?: number;
    rewardState?: string;
    periodEnd?: string;
  };
  signature?: string;
  clan?: {
    id?: string;
    name?: string;
    level?: number;
    captainId?: string;
    memberNum?: number;
    capacity?: number;
  };
  pet?: {
    id?: number;
    name?: string;
    level?: number;
    exp?: number;
    skinId?: number;
    selected?: boolean;
  };
  avatar?: {
    id?: number;
    file?: string;
    url?: string;
    garenaUrl?: string;
  };
  assets?: {
    avatar?: { url?: string };
    profileAvatar?: { url?: string };
    pin?: { url?: string };
    banner?: { url?: string };
    primeImage?: { url?: string; level?: number };
    brRankImage?: string;
    csRankImage?: string;
    pet?: { url?: string };
    clothes?: Array<{ id: number; url: string }>;
    weaponSkins?: Array<{ id: number; url: string }>;
  };
  skills?: number[];
  dates?: {
    createdAt?: string;
    createdAtText?: string;
    lastLoginAt?: string;
    lastLoginAtText?: string;
    accountAgeDays?: number;
    accountAgeText?: string;
  };
  estimate?: {
    idr?: number;
    text?: string;
    diamonds?: number;
    usd?: number;
    myr?: number;
    source?: string;
  };
  social?: {
    accountId?: string;
    language?: string;
    rankShow?: string;
  };
}

export interface FreeFireStalkerResponse {
  author?: string;
  service?: string;
  ok: boolean;
  uid?: string;
  profile?: FFProfile;
  discord?: {
    webhookPayload?: any;
    webhookPayloadOld?: any;
  };
  message?: string;
}

export interface RobloxGame {
  id: number;
  name: string;
  description?: string;
  creator?: {
    id?: number;
    type?: string;
  };
  rootPlace?: {
    id?: number;
    type?: string;
  };
  created?: string;
  updated?: string;
  placeVisits?: number;
}

export interface RobloxInventoryItem {
  userAssetId?: number;
  serialNumber?: number | null;
  assetId?: number;
  name: string;
  recentAveragePrice?: number;
  originalPrice?: number;
  assetStock?: number;
  buildersClubMembershipType?: string;
  isOnHold?: boolean;
}

export interface RobloxProfileData {
  avatar?: string;
  description?: string;
  created?: string;
  isBanned?: boolean;
  externalAppDisplayName?: string | null;
  hasVerifiedBadge?: boolean;
  id: number;
  name: string;
  displayName: string;
  friends?: number;
  followers?: number;
  followings?: number;
  badges?: any[];
  games?: RobloxGame[];
  inventory?: RobloxInventoryItem[];
}

export interface RobloxStalkerResponse {
  author?: string;
  status: boolean;
  data?: RobloxProfileData;
  message?: string;
}
