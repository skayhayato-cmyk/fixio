import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Search,
  Download,
  Copy,
  Check,
  Shield,
  Trophy,
  Award,
  Heart,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  Package,
  Archive,
  Image as ImageIcon,
  ImageOff,
  Shirt,
  Crosshair,
  Crown,
  FileCode,
  CheckCircle2,
  X,
  Swords,
  Pin,
  Info,
} from "lucide-react";
import axios from "axios";
import JSZip from "jszip";
import { getProxiedImageUrl, triggerDownload } from "../../services/api";
import { renderFFStalkerCard } from "../../services/canvasGenerators";
import { FreeFireStalkerResponse, FFProfile, FFDiscordEmbed } from "../../types";

type ExportImageFormat = "png" | "jpg";
type JpgMatteOption = "#ffffff" | "#121216" | "#f1f5f9";

const SAMPLE_DATA: FreeFireStalkerResponse = {
  author: "nexadev",
  service: "stalkerff",
  ok: true,
  uid: "7606762852",
  profile: {
    uid: "7606762852",
    nickname: "Bsk.MoBilMBg",
    level: 55,
    exp: 504284,
    region: "ID",
    server: "Indonesia (ID)",
    releaseVersion: "OB55",
    seasonId: 54,
    role: null,
    accountType: 1,
    likes: 1155,
    likesText: "1.155",
    prime: {
      level: 1,
      image: "/api/ff/media?p=update01%2Fprime1.png",
    },
    verified: null,
    ranks: {
      br: {
        points: 2782,
        tier: null,
        image: null,
        imageUrl: null,
        pointsText: "2.782",
        rankId: 316,
        maxRank: 316,
        showInProfile: true,
      },
      cs: {
        tier: "Heroic",
        star: 0,
        image: "br-heroic1.png",
        points: 29,
        rankId: 308,
        maxRank: 308,
        showInProfile: true,
      },
    },
    booyahPass: {
      active: false,
      text: "Tidak Aktif",
    },
    creditScore: {
      value: 100,
      rewardState: "REWARD_STATE_UNCLAIMED",
      periodEnd: "2026-11-14T20:30:58.000Z",
    },
    signature: "JUSTIN BOBON\nFROM ARBENTINA",
    clan: {
      id: "3092482855",
      name: "BARANGREPㅤID",
      level: 2,
      captainId: "1042375533",
      memberNum: 30,
      capacity: 45,
    },
    pet: {
      id: 1300000091,
      name: "manukcs",
      level: 4,
      exp: 540,
      skinId: 1310000093,
      selected: true,
    },
    avatar: {
      id: 902053009,
      file: "images/avatar/902053009.png",
      url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F902053009.png",
      garenaUrl: "https://ff.garena.com/avatar/902053009",
    },
    assets: {
      avatar: {
        id: 902053009,
        file: "images/avatar/902053009.png",
        url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F902053009.png",
        garenaUrl: "https://ff.garena.com/avatar/902053009",
      },
      profileAvatar: {
        id: 102000020,
        file: "images/avatar/102000020.png",
        url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F102000020.png",
        garenaUrl: "https://ff.garena.com/avatar/102000020",
      },
      title: null,
      pin: {
        id: 910040001,
        file: "images/avatar/910040001.png",
        url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F910040001.png",
        garenaUrl: "https://ff.garena.com/avatar/910040001",
      },
      banner: {
        id: 901053008,
        file: "images/avatar/901053008.png",
        url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F901053008.png",
        note: "tidak tersedia di /images/avatar (404)",
      },
      badge: {
        id: 1001000102,
        count: 24,
        url: null,
        note: "badge pakai sprite atlas, tidak ada file per-badge",
      },
      primeImage: {
        level: 1,
        file: "prime1.png",
        url: "/api/ff/media?p=update01%2Fprime1.png",
      },
      verifiedBadge: null,
      brRankImage: null,
      csRankImage: "/api/ff/media?p=update01%2Fimages%2Favatar%2Fbr-heroic1.png",
      pet: {
        id: 1310000093,
        url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F1310000093.png",
      },
      clothes: [
        { id: 205000681, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F205000681.png" },
        { id: 211042036, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F211042036.png" },
        { id: 211052029, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F211052029.png" },
        { id: 214039008, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F214039008.png" },
        { id: 203000987, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F203000987.png" },
        { id: 204053005, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F204053005.png" },
      ],
      weaponSkins: [
        { id: 907104110, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F907104110.png" },
        { id: 912053003, url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F912053003.png" },
      ],
    },
    skills: [16, 5806, 8, 1, 16, 2506, 8, 2, 16, 4306, 8, 3, 16, 7506],
    dates: {
      createdAt: "2023-04-12T16:00:20.000Z",
      createdAtText: "Rabu, 12 April 2023",
      lastLoginAt: "2026-11-13T04:30:25.000Z",
      lastLoginAtText: "Jumat, 13 November 2026 • 04:30 WIB",
      accountAgeDays: 1312,
      accountAgeText: "3 tahun 7 bulan",
    },
    estimate: {
      idr: 494000,
      text: "Rp 494.000",
      source: "formula (prime + likes*12 + level*8500)",
      diamonds: 390,
      usd: 28.17,
      myr: 114.24,
    },
    social: {
      accountId: "7606762852",
      language: "Language_INDONESIAN",
      modePrefer: null,
      rankShow: "RankShow_BR",
    },
  },
  discord: {
    note: "Payload embed Discord — siap dipakai langsung sebagai body POST ke webhook.",
    embeds: [
      {
        author: {
          name: "NOTIF FIXIO CEK FF",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/FF_UI_Badge_UGC.png",
        },
        title: "Bsk.MoBilMBg",
        description: "```\nUID : 7606762852\n```",
        color: 16436245,
        thumbnail: {
          url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F902053009.png",
        },
        fields: [
          { name: "Status", value: "Tidak Verified", inline: true },
          { name: "Estimasi Topup", value: "**Rp 494.000**", inline: true },
          { name: "Prime Level", value: "**1**", inline: true },
          { name: "Total Likes", value: "1.155", inline: true },
          { name: "Level", value: "55", inline: true },
          { name: "BR Ranking", value: "2.782 pts\nRank #316", inline: true },
          { name: "CS Ranking", value: "Heroic (29 pts)", inline: true },
          { name: "Server", value: "Indonesia (ID)", inline: true },
          { name: "Booyah Pass", value: "Tidak Aktif", inline: true },
          { name: "Credit Score", value: "**100**", inline: true },
          { name: "Akun Dibuat", value: "Rabu, 12 April 2023", inline: true },
          { name: "Last Login", value: "Jumat, 13 November 2026 • 04:30 WIB", inline: true },
          { name: "Signature", value: "JUSTIN BOBON\nFROM ARBENTINA", inline: false },
        ],
        footer: {
          text: "api.nexadev.my.id • Free Fire Account Checker",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/2NBSYS_Level04.png",
        },
        timestamp: "2026-11-14T20:30:58.000Z",
      },
      {
        author: {
          name: "CAPTAIN INFO — FIXIO",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/FF_UI_Badge_UGC.png",
        },
        title: "BRPㅤＮＡＰＯＬＥＯＮ",
        description: "```\nUID : 1042375533\n```",
        color: 16096779,
        thumbnail: {
          url: "/api/ff/media?p=update01%2Fimages%2Favatar%2F902000004.png",
        },
        fields: [
          { name: "Status", value: "Tidak Verified", inline: true },
          { name: "Estimasi Topup", value: "**Rp 764.000**", inline: true },
          { name: "Prime Level", value: "**1**", inline: true },
          { name: "Total Likes", value: "4.871", inline: true },
          { name: "Akun Dibuat", value: "Selasa, 28 Mei 2019", inline: true },
          { name: "Clan", value: "**BARANGREPㅤID** (Lv.2)", inline: false },
        ],
        footer: {
          text: "api.nexadev.my.id • Captain Info",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/2NBSYS_Level04.png",
        },
        timestamp: "2026-11-14T20:30:58.000Z",
      },
    ],
  },
};

const resolveAbsoluteAssetUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${url}`;
  }
  return url;
};

const detectSourceExt = (url: string): string => {
  const lower = decodeURIComponent(url).toLowerCase();
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "JPG";
  if (lower.includes(".webp")) return "WEBP";
  return "PNG";
};

const sanitizeEmbedArray = (embeds?: FFDiscordEmbed[]): FFDiscordEmbed[] => {
  if (!Array.isArray(embeds)) return [];
  return embeds.map((emb) => {
    const cloned = JSON.parse(JSON.stringify(emb));
    if (cloned.thumbnail?.url) {
      cloned.thumbnail.url = resolveAbsoluteAssetUrl(cloned.thumbnail.url);
    }
    if (cloned.author?.icon_url) {
      cloned.author.icon_url = resolveAbsoluteAssetUrl(cloned.author.icon_url);
    }
    if (cloned.footer?.icon_url) {
      cloned.footer.icon_url = resolveAbsoluteAssetUrl(cloned.footer.icon_url);
    }
    return cloned;
  });
};

export const sanitizeDiscordData = (
  discord?: FreeFireStalkerResponse["discord"]
): FreeFireStalkerResponse["discord"] | null => {
  if (!discord) return null;
  const cloned = JSON.parse(JSON.stringify(discord));
  if (Array.isArray(cloned.embeds)) {
    cloned.embeds = sanitizeEmbedArray(cloned.embeds);
  }
  if (Array.isArray(cloned.webhookPayload?.embeds)) {
    cloned.webhookPayload.embeds = sanitizeEmbedArray(cloned.webhookPayload.embeds);
  }
  if (Array.isArray(cloned.webhookPayloadOld?.embeds)) {
    cloned.webhookPayloadOld.embeds = sanitizeEmbedArray(cloned.webhookPayloadOld.embeds);
  }
  if (!cloned.embeds && Array.isArray(cloned.webhookPayload?.embeds)) {
    cloned.embeds = cloned.webhookPayload.embeds;
  }
  return cloned;
};

export interface ExtractedAsset {
  id: string;
  name: string;
  category: "avatar" | "rank" | "prime" | "pet" | "clothes" | "weapon" | "pin" | "discord";
  categoryLabel: string;
  url: string;
  rawId?: number | string;
  sourceFormat: string;
}

/**
 * Fetch an image asset through our proxy and convert it cleanly on HTML5 Canvas
 * into an authentic PNG (lossless transparent) or JPG (solid matte background) Blob.
 */
async function convertAssetToBlob(
  assetUrl: string,
  targetFormat: ExportImageFormat,
  jpgMatte: JpgMatteOption = "#ffffff"
): Promise<Blob> {
  const proxiedUrl = getProxiedImageUrl(assetUrl);
  const res = await fetch(proxiedUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const sourceBlob = await res.blob();
  const objectUrl = URL.createObjectURL(sourceBlob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal mendekode gambar"));
      img.src = objectUrl;
    });

    const width = img.naturalWidth || 300;
    const height = img.naturalHeight || 300;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak didukung");

    if (targetFormat === "jpg") {
      ctx.fillStyle = jpgMatte;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const mime = targetFormat === "jpg" ? "image/jpeg" : "image/png";
    const quality = targetFormat === "jpg" ? 0.95 : 1.0;

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Gagal mengonversi ke " + targetFormat.toUpperCase()));
        },
        mime,
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const FreeFireStalkerTool: React.FC = () => {
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [profile, setProfile] = useState<FFProfile | null>(null);
  const [discordData, setDiscordData] = useState<FreeFireStalkerResponse["discord"] | null>(null);
  const [generatedCardDataUrl, setGeneratedCardDataUrl] = useState<string | null>(null);
  const [cardFormat, setCardFormat] = useState<ExportImageFormat>("png");
  const [activeTab, setActiveTab] = useState<"assets" | "card" | "details" | "ranks" | "clan" | "discord">("assets");

  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [bulkFormat, setBulkFormat] = useState<ExportImageFormat>("png");
  const [jpgMatte, setJpgMatte] = useState<JpgMatteOption>("#ffffff");
  const [convertingKey, setConvertingKey] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>("");
  const [failedAssets, setFailedAssets] = useState<Record<string, boolean>>({});
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [previewModalAsset, setPreviewModalAsset] = useState<ExtractedAsset | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateProfileCard = async (targetProfile: FFProfile, format: ExportImageFormat) => {
    setIsGeneratingCard(true);
    try {
      const cardUrl = await renderFFStalkerCard(targetProfile, format);
      setGeneratedCardDataUrl(cardUrl);
    } catch (canvasErr) {
      console.warn("Gagal membuat kartu profil:", canvasErr);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleCardFormatChange = async (newFormat: ExportImageFormat) => {
    setCardFormat(newFormat);
    if (profile) {
      await generateProfileCard(profile, newFormat);
    }
  };

  // Extract all PNG/JPG image assets cleanly, deduplicating by file/URL and flagging unavailable 404 items
  const { extractedAssets, skippedNotes } = useMemo(() => {
    if (!profile) return { extractedAssets: [] as ExtractedAsset[], skippedNotes: [] as string[] };
    const list: ExtractedAsset[] = [];
    const notes: string[] = [];
    const seenUrls = new Set<string>();

    const pushAsset = (item: Omit<ExtractedAsset, "sourceFormat">) => {
      const normalized = resolveAbsoluteAssetUrl(item.url);
      if (!item.url || seenUrls.has(item.url) || seenUrls.has(normalized)) return;
      seenUrls.add(item.url);
      seenUrls.add(normalized);
      list.push({
        ...item,
        sourceFormat: detectSourceExt(item.url),
      });
    };

    const avatarUrl = profile.avatar?.url || profile.assets?.avatar?.url;
    if (avatarUrl) {
      pushAsset({
        id: "avatar_game",
        name: `Avatar Akun (${profile.nickname})`,
        category: "avatar",
        categoryLabel: "Avatar Utama",
        url: avatarUrl,
        rawId: profile.avatar?.id || profile.assets?.avatar?.id,
      });
    }

    const profileAvUrl = profile.assets?.profileAvatar?.url;
    if (profileAvUrl) {
      pushAsset({
        id: "avatar_profile",
        name: "Foto Karakter FF",
        category: "avatar",
        categoryLabel: "Foto Profil",
        url: profileAvUrl,
        rawId: profile.assets?.profileAvatar?.id,
      });
    }

    const brRankUrl = profile.assets?.brRankImage || profile.ranks?.br?.imageUrl;
    if (brRankUrl) {
      pushAsset({
        id: "rank_br",
        name: `Lencana BR (${profile.ranks?.br?.tier || `Rank #${profile.ranks?.br?.rankId || "BR"}`})`,
        category: "rank",
        categoryLabel: "Rank BR",
        url: brRankUrl,
        rawId: profile.ranks?.br?.rankId || "BR",
      });
    }

    const csRankUrl = profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl;
    if (csRankUrl) {
      pushAsset({
        id: "rank_cs",
        name: `Lencana CS (${profile.ranks?.cs?.tier || `Rank #${profile.ranks?.cs?.rankId || "CS"}`})`,
        category: "rank",
        categoryLabel: "Rank CS",
        url: csRankUrl,
        rawId: profile.ranks?.cs?.rankId || "CS",
      });
    }

    const primeUrl = profile.assets?.primeImage?.url || profile.prime?.image;
    if (primeUrl) {
      pushAsset({
        id: "prime_badge",
        name: `Lencana Prime Lv.${profile.prime?.level ?? 1}`,
        category: "prime",
        categoryLabel: "Prime",
        url: primeUrl,
        rawId: profile.prime?.level ?? 1,
      });
    }

    const petUrl = profile.assets?.pet?.url;
    if (petUrl) {
      pushAsset({
        id: "pet_skin",
        name: `Skin Pet (${profile.pet?.name || "Companion"})`,
        category: "pet",
        categoryLabel: "Pet",
        url: petUrl,
        rawId: profile.assets?.pet?.id || profile.pet?.skinId,
      });
    }

    const pinUrl = profile.assets?.pin?.url;
    if (pinUrl) {
      pushAsset({
        id: "profile_pin",
        name: "Pin Profil Akun",
        category: "pin",
        categoryLabel: "Pin",
        url: pinUrl,
        rawId: profile.assets?.pin?.id,
      });
    }

    if (profile.assets?.banner?.url) {
      const bannerNote = profile.assets.banner.note?.toLowerCase() || "";
      if (bannerNote.includes("404") || bannerNote.includes("tidak tersedia")) {
        notes.push(`Banner #${profile.assets.banner.id || "-"} (${profile.assets.banner.note})`);
      } else {
        pushAsset({
          id: "profile_banner",
          name: "Banner Profil Akun",
          category: "avatar",
          categoryLabel: "Banner",
          url: profile.assets.banner.url,
          rawId: profile.assets.banner.id,
        });
      }
    }

    if (profile.assets?.verifiedBadge && typeof profile.assets.verifiedBadge === "object" && profile.assets.verifiedBadge.url) {
      pushAsset({
        id: "verified_badge",
        name: "Verified Badge",
        category: "prime",
        categoryLabel: "Verified",
        url: profile.assets.verifiedBadge.url,
        rawId: profile.assets.verifiedBadge.id,
      });
    }

    if (profile.assets?.title && typeof profile.assets.title === "object" && profile.assets.title.url) {
      pushAsset({
        id: "profile_title",
        name: "Title Akun",
        category: "pin",
        categoryLabel: "Title",
        url: profile.assets.title.url,
        rawId: profile.assets.title.id,
      });
    }

    if (profile.assets?.badge?.count && !profile.assets.badge.url) {
      notes.push(`${profile.assets.badge.count} Badge Akun memakai sprite atlas internal Garena`);
    }

    if (Array.isArray(profile.assets?.clothes)) {
      profile.assets.clothes.forEach((cloth, idx) => {
        if (cloth.url) {
          pushAsset({
            id: `clothes_${cloth.id}_${idx}`,
            name: `Outfit Bundle #${cloth.id}`,
            category: "clothes",
            categoryLabel: "Pakaian",
            url: cloth.url,
            rawId: cloth.id,
          });
        }
      });
    }

    if (Array.isArray(profile.assets?.weaponSkins)) {
      profile.assets.weaponSkins.forEach((wp, idx) => {
        if (wp.url) {
          pushAsset({
            id: `weapon_${wp.id}_${idx}`,
            name: `Skin Senjata #${wp.id}`,
            category: "weapon",
            categoryLabel: "Senjata",
            url: wp.url,
            rawId: wp.id,
          });
        }
      });
    }

    const embedSources = [
      ...(discordData?.embeds || []),
      ...(discordData?.webhookPayload?.embeds || []),
    ];
    embedSources.forEach((emb, i) => {
      if (emb.thumbnail?.url) {
        pushAsset({
          id: `discord_thumb_${i}`,
          name: emb.title ? `Avatar ${emb.title}` : `Thumbnail #${i + 1}`,
          category: "discord",
          categoryLabel: "Captain",
          url: emb.thumbnail.url,
        });
      }
      if (emb.author?.icon_url) {
        pushAsset({
          id: `discord_badge_ugc_${i}`,
          name: "Lencana UI Badge UGC",
          category: "discord",
          categoryLabel: "UI Badge",
          url: emb.author.icon_url,
        });
      }
      if (emb.footer?.icon_url) {
        pushAsset({
          id: `discord_level_icon_${i}`,
          name: "Icon Level Garena",
          category: "discord",
          categoryLabel: "Level Icon",
          url: emb.footer.icon_url,
        });
      }
    });

    return { extractedAssets: list, skippedNotes: notes };
  }, [profile, discordData]);

  const filteredAssets = useMemo(() => {
    if (assetFilter === "all") return extractedAssets;
    return extractedAssets.filter((a) => a.category === assetFilter);
  }, [extractedAssets, assetFilter]);

  const handleSearch = async (e?: React.FormEvent, customUid?: string) => {
    if (e) e.preventDefault();
    const targetUid = (customUid || uid).trim();
    if (!targetUid) {
      setError("Masukkan UID akun Free Fire.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);
    setIsLoading(true);
    setProfile(null);
    setDiscordData(null);
    setGeneratedCardDataUrl(null);
    setFailedAssets({});
    setAvatarFailed(false);

    try {
      let data: FreeFireStalkerResponse | null = null;
      const localRes = await axios.get<FreeFireStalkerResponse>(
        `/api/stalker/ff?id=${encodeURIComponent(targetUid)}`,
        { signal: abortControllerRef.current.signal }
      );
      data = localRes.data;

      if ((!data || !data.ok || !data.profile) && targetUid === "7606762852") {
        data = SAMPLE_DATA;
      }

      if (data && data.ok && data.profile) {
        setProfile(data.profile);
        setDiscordData(sanitizeDiscordData(data.discord));
        await generateProfileCard(data.profile, cardFormat);
      } else {
        setError(data?.message || "Akun Free Fire tidak ditemukan. Periksa kembali UID.");
      }
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      if (targetUid === "7606762852") {
        setProfile(SAMPLE_DATA.profile!);
        setDiscordData(sanitizeDiscordData(SAMPLE_DATA.discord));
        await generateProfileCard(SAMPLE_DATA.profile!, cardFormat);
        return;
      }
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Gagal menghubungi server Free Fire. Pastikan UID valid dan coba beberapa saat lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    setUid("7606762852");
    setError(null);
    setFailedAssets({});
    setAvatarFailed(false);
    setProfile(SAMPLE_DATA.profile!);
    setDiscordData(sanitizeDiscordData(SAMPLE_DATA.discord));
    setActiveTab("assets");
    generateProfileCard(SAMPLE_DATA.profile!, cardFormat);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const convertAndDownloadSingle = async (asset: ExtractedAsset, format: ExportImageFormat) => {
    const key = `${asset.id}_${format}`;
    setConvertingKey(key);
    const cleanFilename = `ff_${asset.category}_${asset.rawId || asset.id}.${format}`;

    try {
      const blob = await convertAssetToBlob(asset.url, format, jpgMatte);
      const blobUrl = URL.createObjectURL(blob);
      await triggerDownload(blobUrl, cleanFilename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.warn("Canvas conversion fallback:", err);
      if (format === "png") {
        await triggerDownload(getProxiedImageUrl(asset.url, true, cleanFilename), cleanFilename);
      } else {
        setError(`Gagal mengonversi "${asset.name}" ke JPG karena aset tidak tersedia di server.`);
      }
    } finally {
      setConvertingKey(null);
    }
  };

  const handleDownloadAllZip = async (targetFormat: ExportImageFormat) => {
    const availableAssets = extractedAssets.filter((a) => !failedAssets[a.id]);
    if (!profile || availableAssets.length === 0) return;

    setIsZipping(true);
    setZipProgress(`Menyiapkan ${availableAssets.length} aset ke format ${targetFormat.toUpperCase()}...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`ff_${profile.uid}_${targetFormat}`);

      let successCount = 0;
      const usedNames = new Set<string>();

      for (let i = 0; i < availableAssets.length; i++) {
        const item = availableAssets[i];
        setZipProgress(
          `Mengonversi ke ${targetFormat.toUpperCase()} (${i + 1}/${availableAssets.length}): ${item.name}`
        );

        try {
          const convertedBlob = await convertAssetToBlob(item.url, targetFormat, jpgMatte);
          let baseName = `${item.category}_${item.rawId || i + 1}`.replace(/[^a-zA-Z0-9._-]/g, "_");
          if (usedNames.has(baseName)) {
            baseName = `${baseName}_${i + 1}`;
          }
          usedNames.add(baseName);
          folder?.file(`${baseName}.${targetFormat}`, convertedBlob);
          successCount++;
        } catch (itemErr) {
          console.warn(`Lewati aset ${item.name} (tidak tersedia/error):`, itemErr);
        }
      }

      if (successCount === 0) {
        setError("Tidak ada aset gambar yang berhasil diunduh ke dalam ZIP.");
        setIsZipping(false);
        setZipProgress("");
        return;
      }

      setZipProgress("Mengompresi arsip ZIP...");
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      await triggerDownload(zipUrl, `ff_assets_${profile.uid}_all_${targetFormat}.zip`);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 15000);

      setZipProgress(`Selesai! ${successCount} file ${targetFormat.toUpperCase()} berhasil dikemas.`);
      setTimeout(() => {
        setIsZipping(false);
        setZipProgress("");
      }, 2500);
    } catch (zipErr) {
      console.error("Gagal membuat zip:", zipErr);
      setError("Gagal mengemas arsip ZIP. Silakan unduh file secara satuan.");
      setIsZipping(false);
      setZipProgress("");
    }
  };

  const embedsList = useMemo(() => {
    return discordData?.embeds || discordData?.webhookPayload?.embeds || [];
  }, [discordData]);

  const brTierDisplay =
    profile?.ranks?.br?.tier ||
    (profile?.ranks?.br?.rankId ? `Rank #${profile.ranks.br.rankId}` : "Unranked");
  const csTierDisplay =
    profile?.ranks?.cs?.tier ||
    (profile?.ranks?.cs?.rankId ? `Rank #${profile.ranks.cs.rankId}` : "Unranked");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm mb-1">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>Gaming Intelligence & Image Converter</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Stalker Free Fire
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Lacak akun Free Fire via UID, ekstrak seluruh aset gambar (Avatar, Pin, Rank, Prime, Pet, Baju, Senjata) dan konversi langsung ke format PNG atau JPG.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSearch}
        className="bg-slate-50/70 dark:bg-[#121214] p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs space-y-4"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              User ID (UID) Free Fire <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={loadSampleData}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Contoh UID: 7606762852
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="Masukkan UID FF (contoh: 7606762852)"
            value={uid}
            onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Konversi instan ke PNG transparan maupun JPG berkualitas tinggi</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadSampleData}
              className="px-4 py-2.5 bg-slate-200/70 dark:bg-[#202024] hover:bg-slate-200 dark:hover:bg-[#2c2c30] text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Muat Contoh
            </button>
            <button
              type="submit"
              disabled={isLoading || !uid}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:opacity-95 active:scale-[0.98] text-white font-semibold rounded-xl shadow-md hover:shadow-orange-500/20 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat Profil & Aset...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Stalk Akun FF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Informasi</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Results */}
      {profile && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2.5 overflow-x-auto no-scrollbar">
            {[
              { id: "assets" as const, icon: Package, label: `Semua Aset (${extractedAssets.length})` },
              { id: "card" as const, icon: Sparkles, label: "Kartu Profil HD" },
              { id: "details" as const, icon: Shield, label: "Ringkasan Akun" },
              { id: "ranks" as const, icon: Trophy, label: "Rank BR & CS" },
              { id: "clan" as const, icon: Users, label: "Guild & Pet" },
              ...(embedsList.length > 0
                ? [{ id: "discord" as const, icon: FileCode, label: "Discord Embed" }]
                : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    active
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* TAB 1: ALL ASSETS GALLERY & CONVERTER (PNG / JPG) */}
            {activeTab === "assets" && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Asset Control Bar */}
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        {extractedAssets.length} Aset Siap Konversi
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Mendukung PNG Transparan & JPG HD
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Galeri & Konverter PNG / JPG Free Fire
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pilih format PNG atau JPG per item maupun sekaligus dalam arsip ZIP.
                    </p>
                  </div>

                  {/* Format Selector + Bulk ZIP */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10">
                      {(["png", "jpg"] as ExportImageFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setBulkFormat(fmt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                            bulkFormat === fmt
                              ? "bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-xs"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>

                    {bulkFormat === "jpg" && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300">
                        <span>Latar JPG:</span>
                        {(
                          [
                            { color: "#ffffff", label: "Putih" },
                            { color: "#121216", label: "Gelap" },
                            { color: "#f1f5f9", label: "Abu" },
                          ] as const
                        ).map((m) => (
                          <button
                            key={m.color}
                            type="button"
                            onClick={() => setJpgMatte(m.color)}
                            title={m.label}
                            className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                              jpgMatte === m.color
                                ? "ring-2 ring-amber-500 scale-110 border-amber-500"
                                : "border-slate-300 dark:border-white/20"
                            }`}
                            style={{ backgroundColor: m.color }}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleDownloadAllZip(bulkFormat)}
                      disabled={isZipping || extractedAssets.length === 0}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isZipping ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengemas ZIP...</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4" />
                          <span>Unduh Semua {bulkFormat.toUpperCase()} (.ZIP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress alert if zipping */}
                {zipProgress && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <span>{zipProgress}</span>
                  </div>
                )}

                {/* Unavailable/Atlas Metadata Notes (e.g. 404 banner, sprite badge) */}
                {skippedNotes.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-[#16161a] border border-black/5 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      {skippedNotes.map((note, idx) => (
                        <p key={idx}>{note}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: "all", label: `Semua (${extractedAssets.length})` },
                    { key: "clothes", label: "Pakaian", icon: Shirt },
                    { key: "weapon", label: "Senjata", icon: Crosshair },
                    { key: "rank", label: "Rank", icon: Trophy },
                    { key: "avatar", label: "Avatar & Profil", icon: ImageIcon },
                    { key: "prime", label: "Prime", icon: Crown },
                    { key: "pet", label: "Pet", icon: Sparkles },
                    { key: "pin", label: "Pin", icon: Pin },
                    { key: "discord", label: "Badges", icon: Users },
                  ].map((f) => {
                    const Icon = f.icon;
                    const count =
                      f.key === "all"
                        ? extractedAssets.length
                        : extractedAssets.filter((a) => a.category === f.key).length;
                    if (f.key !== "all" && count === 0) return null;

                    return (
                      <button
                        key={f.key}
                        onClick={() => setAssetFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          assetFilter === f.key
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                            : "bg-white dark:bg-[#18181b] border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#202024]"
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>
                          {f.label} {f.key !== "all" ? `(${count})` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Asset Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredAssets.map((asset) => {
                    const isFailed = Boolean(failedAssets[asset.id]);
                    const isConvertingPng = convertingKey === `${asset.id}_png`;
                    const isConvertingJpg = convertingKey === `${asset.id}_jpg`;
                    const shareUrl = resolveAbsoluteAssetUrl(asset.url);

                    return (
                      <div
                        key={asset.id}
                        className="bg-white dark:bg-[#121214] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                      >
                        {/* Preview Box */}
                        <div
                          onClick={() => !isFailed && setPreviewModalAsset(asset)}
                          className={`relative aspect-square w-full flex items-center justify-center p-3 overflow-hidden ${
                            isFailed ? "cursor-default" : "cursor-pointer"
                          }`}
                          style={
                            bulkFormat === "jpg"
                              ? { backgroundColor: jpgMatte }
                              : {
                                  backgroundColor: "rgba(148, 163, 184, 0.08)",
                                  backgroundImage:
                                    "linear-gradient(45deg, rgba(128,128,128,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.08) 75%)",
                                  backgroundSize: "16px 16px",
                                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                                }
                          }
                        >
                          {isFailed ? (
                            <div className="flex flex-col items-center justify-center text-center gap-1.5 text-slate-400 dark:text-slate-500 p-2">
                              <ImageOff className="w-7 h-7" />
                              <span className="text-[10px] font-medium">Aset 404</span>
                            </div>
                          ) : (
                            <img
                              src={getProxiedImageUrl(asset.url)}
                              alt={asset.name}
                              crossOrigin="anonymous"
                              onError={() =>
                                setFailedAssets((prev) => ({ ...prev, [asset.id]: true }))
                              }
                              className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                          )}

                          <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/65 text-white backdrop-blur-xs">
                            {asset.categoryLabel}
                          </span>

                          <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                            {asset.sourceFormat}
                          </span>
                        </div>

                        {/* Metadata & PNG / JPG Converters */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <h4
                              className="text-xs font-bold text-slate-900 dark:text-white truncate"
                              title={asset.name}
                            >
                              {asset.name}
                            </h4>
                            {asset.rawId !== undefined && (
                              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                ID: {asset.rawId}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 pt-1.5 border-t border-black/5 dark:border-white/5">
                            <button
                              onClick={() => convertAndDownloadSingle(asset, "png")}
                              disabled={isFailed || isConvertingPng || isConvertingJpg}
                              title="Konversi & Unduh PNG Transparan"
                              className="flex-1 py-1.5 px-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              {isConvertingPng ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              <span>PNG</span>
                            </button>

                            <button
                              onClick={() => convertAndDownloadSingle(asset, "jpg")}
                              disabled={isFailed || isConvertingPng || isConvertingJpg}
                              title="Konversi & Unduh JPG"
                              className="flex-1 py-1.5 px-1.5 bg-slate-900 dark:bg-white hover:opacity-90 active:scale-95 text-white dark:text-slate-950 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              {isConvertingJpg ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              <span>JPG</span>
                            </button>

                            <button
                              onClick={() => handleCopy(shareUrl, asset.id)}
                              title="Salin Link Gambar"
                              className="p-1.5 bg-slate-100 dark:bg-[#1c1c1e] hover:bg-slate-200 dark:hover:bg-[#28282c] text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer shrink-0"
                            >
                              {copiedText === asset.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB 2: KARTU PROFIL HD (PNG & JPG) */}
            {activeTab === "card" && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        Konversi Kartu HD
                      </span>
                      <span className="text-xs text-slate-400">1200 × 675 PX</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      Kartu Gamer Free Fire Siap Unduh
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Render visual profil lengkap dalam format PNG atau JPG.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10">
                      {(["png", "jpg"] as ExportImageFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => handleCardFormatChange(fmt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                            cardFormat === fmt
                              ? "bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-xs"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (generatedCardDataUrl && profile) {
                          triggerDownload(
                            generatedCardDataUrl,
                            `ff_profile_${profile.uid}_${Date.now()}.${cardFormat}`
                          );
                        }
                      }}
                      disabled={!generatedCardDataUrl || isGeneratingCard}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh {cardFormat.toUpperCase()} HD</span>
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 dark:border-white/10 flex items-center justify-center min-h-[280px]">
                  {isGeneratingCard ? (
                    <div className="flex flex-col items-center justify-center p-8 text-amber-400 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="text-xs font-semibold">
                        Merender kartu profil ke {cardFormat.toUpperCase()} HD...
                      </p>
                    </div>
                  ) : generatedCardDataUrl ? (
                    <img
                      src={generatedCardDataUrl}
                      alt={`FF Profile ${profile.nickname}`}
                      className="w-full h-auto object-contain rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs p-6 text-center">
                      Gagal merender kartu profil. Gunakan tab Semua Aset untuk mengunduh gambar satuan.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: RINGKASAN AKUN */}
            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-6 shadow-xs">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 p-1 shadow-md flex items-center justify-center">
                        {(profile.avatar?.url || profile.assets?.avatar?.url) && !avatarFailed ? (
                          <img
                            src={getProxiedImageUrl(
                              profile.avatar?.url || profile.assets?.avatar?.url || ""
                            )}
                            alt={profile.nickname}
                            onError={() => setAvatarFailed(true)}
                            className="w-full h-full object-cover rounded-xl bg-slate-900"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-3xl">
                            {(profile.nickname || "F").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-md shadow-xs">
                        Lv.{profile.level}
                      </span>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {profile.nickname}
                        </h3>
                        {profile.prime?.level !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-md border border-amber-200 dark:border-amber-800/40">
                            <Crown className="w-3.5 h-3.5" />
                            <span>Prime Lv.{profile.prime.level}</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-md">
                          {profile.server || profile.region || "ID"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono bg-slate-100 dark:bg-[#1c1c1e] px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          UID: {profile.uid}
                        </span>
                        <button
                          onClick={() => handleCopy(profile.uid, "uid")}
                          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {copiedText === "uid" ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedText === "uid" ? "Tersalin" : "Salin UID"}</span>
                        </button>
                        <span>•</span>
                        <span>Season {profile.seasonId || "-"}</span>
                        <span>•</span>
                        <span>Versi {profile.releaseVersion || "-"}</span>
                      </div>

                      {profile.signature && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/50 dark:bg-[#1c1c1e] p-2.5 rounded-lg border border-amber-100/50 dark:border-white/10 mt-2 whitespace-pre-line">
                          &ldquo;{profile.signature}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-black/5 dark:border-white/10">
                    <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Total Likes</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {profile.likesText || profile.likes?.toLocaleString("id-ID") || 0}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Credit Score</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {profile.creditScore?.value ?? 100} / 100
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>Umur Akun</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {profile.dates?.accountAgeText || "-"}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {profile.dates?.createdAtText || "-"}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                        <span>Estimasi Topup</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                        {profile.estimate?.text || "Rp 0"}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        ~{profile.estimate?.diamonds || 0} Diamonds (${profile.estimate?.usd || "0"})
                      </p>
                    </div>
                  </div>

                  {/* Account Activity Details */}
                  <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Terakhir Login:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {profile.dates?.lastLoginAtText || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Total EXP:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {profile.exp?.toLocaleString("id-ID")} EXP
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Booyah Pass:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {profile.booyahPass?.text || "Tidak Aktif"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Rumus Valuasi:</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {profile.estimate?.source || "Prime + Likes + Level"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: RANKS BR & CS */}
            {activeTab === "ranks" && (
              <motion.div
                key="ranks"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Battle Royale */}
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-amber-200/80 dark:border-amber-800/40 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                      <Trophy className="w-4 h-4" />
                      <span>Battle Royale (BR)</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold border border-transparent dark:border-amber-800/40">
                      Rank ID: {profile.ranks?.br?.rankId || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-20 h-20 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 p-2 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-800/30">
                      {profile.assets?.brRankImage || profile.ranks?.br?.imageUrl ? (
                        <img
                          src={getProxiedImageUrl(
                            profile.assets?.brRankImage || profile.ranks?.br?.imageUrl || ""
                          )}
                          alt="BR Rank"
                          className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-amber-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                        {brTierDisplay}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        Points: {profile.ranks?.br?.pointsText || profile.ranks?.br?.points || 0} pts
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Tampil di profil: {profile.ranks?.br?.showInProfile ? "Ya" : "Tidak"} • Max
                        Rank: {profile.ranks?.br?.maxRank || "-"}
                      </p>
                    </div>
                  </div>

                  {(profile.assets?.brRankImage || profile.ranks?.br?.imageUrl) && (
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-end gap-2">
                      {(["png", "jpg"] as ExportImageFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => {
                            const url = profile.assets?.brRankImage || profile.ranks?.br?.imageUrl;
                            if (url) {
                              convertAndDownloadSingle(
                                {
                                  id: "rank_br",
                                  name: `BR_${brTierDisplay}`,
                                  category: "rank",
                                  categoryLabel: "Rank BR",
                                  url,
                                  rawId: profile.ranks?.br?.rankId || "BR",
                                  sourceFormat: detectSourceExt(url),
                                },
                                fmt
                              );
                            }
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh {fmt.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clash Squad */}
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-purple-200/80 dark:border-purple-800/40 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                      <Swords className="w-4 h-4" />
                      <span>Clash Squad (CS)</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-semibold border border-transparent dark:border-purple-800/40">
                      Rank ID: {profile.ranks?.cs?.rankId || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <div className="w-20 h-20 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 p-2 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/30">
                      {profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl ? (
                        <img
                          src={getProxiedImageUrl(
                            profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl || ""
                          )}
                          alt="CS Rank"
                          className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                        />
                      ) : (
                        <Zap className="w-8 h-8 text-purple-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                        {csTierDisplay}
                      </h4>
                      <p className="text-xs text-purple-700 dark:text-purple-400 font-bold">
                        {profile.ranks?.cs?.star ?? 0} Star • Points: {profile.ranks?.cs?.points ?? 0}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Tampil di profil: {profile.ranks?.cs?.showInProfile ? "Ya" : "Tidak"} • Max
                        Rank: {profile.ranks?.cs?.maxRank || "-"}
                      </p>
                    </div>
                  </div>

                  {(profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl) && (
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-end gap-2">
                      {(["png", "jpg"] as ExportImageFormat[]).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => {
                            const url = profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl;
                            if (url) {
                              convertAndDownloadSingle(
                                {
                                  id: "rank_cs",
                                  name: `CS_${csTierDisplay}`,
                                  category: "rank",
                                  categoryLabel: "Rank CS",
                                  url,
                                  rawId: profile.ranks?.cs?.rankId || "CS",
                                  sourceFormat: detectSourceExt(url),
                                },
                                fmt
                              );
                            }
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh {fmt.toUpperCase()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 5: GUILD & PET */}
            {activeTab === "clan" && (
              <motion.div
                key="clan"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Clan Info */}
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm pb-2 border-b border-black/5 dark:border-white/10">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>Clan / Guild Terdaftar</span>
                  </div>

                  {profile.clan?.name ? (
                    <div className="space-y-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400">Nama Guild:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {profile.clan.name}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400">Guild ID:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {profile.clan.id}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400">Level Guild:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            Level {profile.clan.level}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400">
                            Kapasitas Anggota:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {profile.clan.memberNum} / {profile.clan.capacity} Member
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Captain UID:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {profile.clan.captainId}
                          </span>
                        </div>
                      </div>

                      {embedsList[1] && (
                        <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                          <div className="flex items-center gap-3">
                            {embedsList[1].thumbnail?.url && (
                              <img
                                src={getProxiedImageUrl(embedsList[1].thumbnail.url)}
                                alt="Captain"
                                className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-amber-500/40 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                Captain Guild
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {embedsList[1].title || "Captain"}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-mono">
                                UID: {profile.clan.captainId}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Akun ini belum bergabung ke dalam Guild.
                    </p>
                  )}
                </div>

                {/* Pet Info */}
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm pb-2 border-b border-black/5 dark:border-white/10">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Pet Companion</span>
                  </div>

                  {profile.pet?.name ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {profile.assets?.pet?.url ? (
                          <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-[#1c1c1e] p-2 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10">
                            <img
                              src={getProxiedImageUrl(profile.assets.pet.url)}
                              alt={profile.pet.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-md"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-8 h-8 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white">
                            {profile.pet.name}
                          </h4>
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            Level {profile.pet.level} • {profile.pet.exp} EXP
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            {profile.pet.selected ? "Aktif / Terpilih" : "Disimpan"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs pt-2 border-t border-black/5 dark:border-white/5">
                        <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400">Pet Skin ID:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {profile.pet.skinId}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500 dark:text-slate-400">Pet Base ID:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {profile.pet.id}
                          </span>
                        </div>
                      </div>

                      {profile.assets?.pet?.url && (
                        <div className="pt-2 flex justify-end gap-2">
                          {(["png", "jpg"] as ExportImageFormat[]).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => {
                                if (profile.assets?.pet?.url) {
                                  convertAndDownloadSingle(
                                    {
                                      id: "pet_skin",
                                      name: `pet_${profile.pet?.name}`,
                                      category: "pet",
                                      categoryLabel: "Skin Pet",
                                      url: profile.assets.pet.url,
                                      rawId: profile.pet?.skinId,
                                      sourceFormat: detectSourceExt(profile.assets.pet.url),
                                    },
                                    fmt
                                  );
                                }
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh {fmt.toUpperCase()}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Tidak ada data pet aktif.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 6: DISCORD WEBHOOK EMBED */}
            {activeTab === "discord" && embedsList.length > 0 && (
              <motion.div
                key="discord"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Format Embed Discord
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Payload siap pakai untuk webhook notifikasi server Discord.
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(JSON.stringify(embedsList, null, 2), "discord_json")}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                    >
                      {copiedText === "discord_json" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedText === "discord_json" ? "JSON Tersalin" : "Salin JSON Embed"}</span>
                    </button>
                  </div>

                  <div className="space-y-4 mt-4">
                    {embedsList.map((emb, idx) => (
                      <div
                        key={idx}
                        className="bg-[#2f3136] text-white p-4 rounded-xl border border-white/10 space-y-3 font-sans relative overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{
                            backgroundColor: emb.color
                              ? `#${emb.color.toString(16).padStart(6, "0")}`
                              : "#f59e0b",
                          }}
                        />

                        {emb.author && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pl-2">
                            {emb.author.icon_url && (
                              <img
                                src={getProxiedImageUrl(emb.author.icon_url)}
                                alt="Icon"
                                className="w-4 h-4 rounded-full"
                              />
                            )}
                            <span>{emb.author.name}</span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div>
                            <h4 className="text-base font-bold text-white">{emb.title}</h4>
                            {emb.description && (
                              <pre className="text-xs font-mono bg-black/30 p-2 rounded-md mt-1 text-slate-300">
                                {emb.description}
                              </pre>
                            )}
                          </div>
                          {emb.thumbnail?.url && (
                            <img
                              src={getProxiedImageUrl(emb.thumbnail.url)}
                              alt="Thumb"
                              className="w-16 h-16 rounded-xl object-contain bg-black/20 shrink-0"
                            />
                          )}
                        </div>

                        {emb.fields && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs pl-2">
                            {emb.fields.map((f, fi) => (
                              <div key={fi} className="p-1.5 bg-black/20 rounded-md">
                                <span className="text-slate-400 font-semibold block text-[11px]">
                                  {f.name}
                                </span>
                                <span className="text-white font-medium text-xs whitespace-pre-line">
                                  {f.value.replace(/\*\*/g, "")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {emb.footer && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1 pl-2">
                            {emb.footer.icon_url && (
                              <img
                                src={getProxiedImageUrl(emb.footer.icon_url)}
                                alt="Icon"
                                className="w-3.5 h-3.5 rounded-full"
                              />
                            )}
                            <span>{emb.footer.text}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox Modal Preview */}
      <AnimatePresence>
        {previewModalAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewModalAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#121214] rounded-2xl border border-black/10 dark:border-white/15 max-w-lg w-full p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                    {previewModalAsset.categoryLabel} • {previewModalAsset.sourceFormat}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {previewModalAsset.name}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewModalAsset(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1c1c1e] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="aspect-square w-full rounded-xl flex items-center justify-center p-6"
                style={
                  bulkFormat === "jpg"
                    ? { backgroundColor: jpgMatte }
                    : {
                        backgroundColor: "rgba(148, 163, 184, 0.1)",
                        backgroundImage:
                          "linear-gradient(45deg, rgba(128,128,128,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.08) 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                      }
                }
              >
                <img
                  src={getProxiedImageUrl(previewModalAsset.url)}
                  alt={previewModalAsset.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => convertAndDownloadSingle(previewModalAsset, "png")}
                  className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh PNG</span>
                </button>
                <button
                  onClick={() => convertAndDownloadSingle(previewModalAsset, "jpg")}
                  className="py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh JPG</span>
                </button>
                <button
                  onClick={() =>
                    handleCopy(resolveAbsoluteAssetUrl(previewModalAsset.url), "modal_copy")
                  }
                  className="py-2.5 px-4 bg-slate-100 dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#28282c]"
                >
                  {copiedText === "modal_copy" ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedText === "modal_copy" ? "Tersalin" : "Salin URL"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
