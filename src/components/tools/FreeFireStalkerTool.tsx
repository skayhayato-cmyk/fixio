import React, { useState, useRef, useMemo } from "react";
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
  Eye,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Zap,
  Package,
  Layers,
  Archive,
  Image as ImageIcon,
  Shirt,
  Crosshair,
  Crown,
  FileCode,
  CheckCircle2,
  X,
} from "lucide-react";
import axios from "axios";
import JSZip from "jszip";
import { fetchProxiedJson, getProxiedImageUrl, triggerDownload } from "../../services/api";
import { renderFFStalkerCard } from "../../services/canvasGenerators";
import { FreeFireStalkerResponse, FFProfile, FFDiscordEmbed } from "../../types";

// Verified sample response for instant testing & fallback
const SAMPLE_DATA: FreeFireStalkerResponse = {
  author: "nexadev",
  service: "stalkerff",
  ok: true,
  uid: "7606762852",
  profile: {
    uid: "7606762852",
    nickname: "Bsk.MoBilMBg",
    level: 54,
    exp: 494967,
    region: "ID",
    server: "Indonesia (ID)",
    releaseVersion: "OB54",
    seasonId: 53,
    role: null,
    accountType: 1,
    likes: 1153,
    likesText: "1.153",
    prime: {
      level: 2,
      image: "https://adenpedia.my.id/update01/prime2.png",
    },
    verified: null,
    ranks: {
      br: {
        points: 1000,
        tier: "Bronze I",
        image: "images/avatar/br-bronze1.png",
        imageUrl: "https://adenpedia.my.id/update01/images/avatar/br-bronze1.png",
        pointsText: "1.000",
        rankId: 301,
        maxRank: 301,
        showInProfile: false,
      },
      cs: {
        tier: "Platinum",
        star: 2,
        image: "Platinum1.png",
        imageUrl: "https://adenpedia.my.id/update01/images/avatar/Platinum1.png",
        points: 38,
        rankId: 311,
        maxRank: 311,
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
      periodEnd: "2026-09-18T02:37:55.000Z",
    },
    signature: "BOBON",
    clan: {
      id: "3092482855",
      name: "BARANGREPㅤID",
      level: 2,
      captainId: "1042375533",
      memberNum: 31,
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
      url: "https://adenpedia.my.id/update01/images/avatar/902053009.png",
      garenaUrl: "https://ff.garena.com/avatar/902053009",
    },
    assets: {
      avatar: {
        id: 902053009,
        file: "images/avatar/902053009.png",
        url: "https://adenpedia.my.id/update01/images/avatar/902053009.png",
        garenaUrl: "https://ff.garena.com/avatar/902053009",
      },
      profileAvatar: {
        id: 102000012,
        file: "images/avatar/102000012.png",
        url: "https://adenpedia.my.id/update01/images/avatar/102000012.png",
        garenaUrl: "https://ff.garena.com/avatar/102000012",
      },
      title: null,
      pin: {
        id: 910040001,
        file: "images/avatar/910040001.png",
        url: "https://adenpedia.my.id/update01/images/avatar/910040001.png",
        garenaUrl: "https://ff.garena.com/avatar/910040001",
      },
      banner: {
        id: 901053008,
        file: "images/avatar/901053008.png",
        url: "https://adenpedia.my.id/update01/images/avatar/901053008.png",
        note: "tidak tersedia di /images/avatar (404)",
      },
      badge: {
        id: 1001000100,
        count: 0,
        url: null,
        note: "badge pakai sprite atlas, tidak ada file per-badge",
      },
      primeImage: {
        level: 2,
        file: "prime2.png",
        url: "https://adenpedia.my.id/update01/prime2.png",
      },
      verifiedBadge: null,
      brRankImage: "https://adenpedia.my.id/update01/images/avatar/br-bronze1.png",
      csRankImage: "https://adenpedia.my.id/update01/images/avatar/Platinum1.png",
      pet: {
        id: 1310000093,
        url: "https://adenpedia.my.id/update01/images/avatar/1310000093.png",
      },
      clothes: [
        {
          id: 214039008,
          url: "https://adenpedia.my.id/update01/images/avatar/214039008.png",
        },
        {
          id: 204053016,
          url: "https://adenpedia.my.id/update01/images/avatar/204053016.png",
        },
        {
          id: 203045033,
          url: "https://adenpedia.my.id/update01/images/avatar/203045033.png",
        },
        {
          id: 203045036,
          url: "https://adenpedia.my.id/update01/images/avatar/203045036.png",
        },
        {
          id: 205053015,
          url: "https://adenpedia.my.id/update01/images/avatar/205053015.png",
        },
      ],
      weaponSkins: [
        {
          id: 907194213,
          url: "https://adenpedia.my.id/update01/images/avatar/907194213.png",
        },
        {
          id: 912053003,
          url: "https://adenpedia.my.id/update01/images/avatar/912053003.png",
        },
      ],
    },
    skills: [16, 5306, 8, 1, 16, 7506, 8, 2, 16, 5506, 8, 3, 16, 4306],
    dates: {
      createdAt: "2023-04-12T16:00:20.000Z",
      createdAtText: "Rabu, 12 April 2023",
      lastLoginAt: "2026-08-06T02:50:41.000Z",
      lastLoginAtText: "Kamis, 6 Agustus 2026 • 02:50 WIB",
      accountAgeDays: 1255,
      accountAgeText: "3 tahun 5 bulan",
    },
    estimate: {
      idr: 600000,
      text: "Rp 600.000",
      source: "formula (prime + likes*12 + level*8500)",
      diamonds: 390,
      usd: 34.22,
      myr: 138.75,
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
          url: "https://adenpedia.my.id/update01/images/avatar/902053009.png",
        },
        fields: [
          { name: "🏅 Status", value: "Tidak Verified", inline: true },
          { name: "💰 Estimasi Topup", value: "**Rp 600.000**", inline: true },
          { name: "👑 Prime Level", value: "**2**", inline: true },
          { name: "❤️ Total Likes", value: "1.153", inline: true },
          { name: "📈 Level", value: "54", inline: true },
          { name: "🏆 BR Ranking", value: "1.000 pts\nBronze I", inline: true },
          { name: "⚔️ CS Ranking", value: "⭐ 2 bintang\nPlatinum", inline: true },
          { name: "🌍 Server", value: "Indonesia (ID)", inline: true },
          { name: "🎫 Booyah Pass", value: "Tidak Aktif", inline: true },
          { name: "💎 Credit Score", value: "**100**", inline: true },
          { name: "📅 Akun Dibuat", value: "Rabu, 12 April 2023", inline: true },
          { name: "⏰ Last Login", value: "Kamis, 6 Agustus 2026 • 02:50 WIB", inline: true },
          { name: "📝 Signature", value: "BOBON", inline: false },
        ],
        footer: {
          text: "api.nexadev.my.id • Free Fire Account Checker",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/2NBSYS_Level04.png",
        },
        timestamp: "2026-09-19T02:57:10.329Z",
      },
      {
        author: {
          name: "👑 CAPTAIN INFO — FIXIO",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/FF_UI_Badge_UGC.png",
        },
        title: "BRPㅤＮＡＰＯＬＥＯＮ",
        description: "```\nUID : 1042375533\n```",
        color: 16096779,
        thumbnail: {
          url: "https://adenpedia.my.id/update01/images/avatar/902000004.png",
        },
        fields: [
          { name: "🏅 Status", value: "Tidak Verified", inline: true },
          { name: "💰 Estimasi Topup", value: "**Rp 764.000**", inline: true },
          { name: "👑 Prime Level", value: "**2**", inline: true },
          { name: "❤️ Total Likes", value: "4.871", inline: true },
          { name: "📅 Akun Dibuat", value: "Selasa, 28 Mei 2019", inline: true },
          { name: "⏰ Last Login", value: "Rabu, 2 September 2026 • 14:02 WIB", inline: true },
          { name: "🏰 Clan", value: "**BARANGREPㅤID** (Lv.2)", inline: false },
        ],
        footer: {
          text: "api.nexadev.my.id • Captain Info",
          icon_url:
            "https://raw.githubusercontent.com/0xme/ff-resources/refs/heads/main/pngs/300x300/2NBSYS_Level04.png",
        },
        timestamp: "2026-09-19T02:57:10.329Z",
      },
    ],
  },
};

export const sanitizeDiscordData = (
  discord?: FreeFireStalkerResponse["discord"]
): FreeFireStalkerResponse["discord"] | null => {
  if (!discord) return null;
  const cloned = JSON.parse(JSON.stringify(discord));
  if (Array.isArray(cloned.embeds)) {
    cloned.embeds = cloned.embeds.map((emb: any) => {
      if (emb.author?.name) {
        emb.author.name = emb.author.name
          .replace(/NOTIF ADENPEDIA CEK FF/gi, "NOTIF FIXIO CEK FF")
          .replace(/ADENPEDIA/gi, "FIXIO");
      }
      if (emb.footer?.text) {
        emb.footer.text = emb.footer.text.replace(/adenpedia\.my\.id/gi, "api.nexadev.my.id");
      }
      if (emb.title) {
        emb.title = emb.title.replace(/ADENPEDIA/gi, "FIXIO");
      }
      return emb;
    });
  }
  return cloned;
};

export interface ExtractedPngAsset {
  id: string;
  name: string;
  category: "avatar" | "rank" | "prime" | "pet" | "clothes" | "weapon" | "pin" | "discord";
  categoryLabel: string;
  url: string;
  rawId?: number | string;
  fileFormat: string;
}

export const FreeFireStalkerTool: React.FC = () => {
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Result state
  const [profile, setProfile] = useState<FFProfile | null>(null);
  const [discordData, setDiscordData] = useState<FreeFireStalkerResponse["discord"] | null>(null);
  const [generatedCardPng, setGeneratedCardPng] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assets" | "card" | "details" | "ranks" | "clan" | "discord">("assets");

  // Asset filtering & converting state
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<string>("");
  const [previewModalAsset, setPreviewModalAsset] = useState<ExtractedPngAsset | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract all PNG assets from the response cleanly
  const extractedAssets: ExtractedPngAsset[] = useMemo(() => {
    if (!profile) return [];
    const list: ExtractedPngAsset[] = [];

    // 1. Avatar Akun
    const avatarUrl = profile.avatar?.url || profile.assets?.avatar?.url;
    if (avatarUrl) {
      list.push({
        id: "avatar_game",
        name: `Avatar Akun (${profile.nickname})`,
        category: "avatar",
        categoryLabel: "Avatar Utama",
        url: avatarUrl,
        rawId: profile.avatar?.id || profile.assets?.avatar?.id || 902053009,
        fileFormat: "PNG",
      });
    }

    // 2. Profile Avatar (Karakter)
    const profileAvUrl = profile.assets?.profileAvatar?.url;
    if (profileAvUrl) {
      list.push({
        id: "avatar_profile",
        name: `Foto Karakter FF`,
        category: "avatar",
        categoryLabel: "Foto Profil",
        url: profileAvUrl,
        rawId: profile.assets?.profileAvatar?.id || 102000012,
        fileFormat: "PNG",
      });
    }

    // 3. BR Rank Image
    const brRankUrl = profile.assets?.brRankImage || profile.ranks?.br?.imageUrl;
    if (brRankUrl) {
      list.push({
        id: "rank_br",
        name: `Lencana BR (${profile.ranks?.br?.tier || "Bronze I"})`,
        category: "rank",
        categoryLabel: "Rank Battle Royale",
        url: brRankUrl,
        rawId: profile.ranks?.br?.rankId || "BR",
        fileFormat: "PNG",
      });
    }

    // 4. CS Rank Image
    const csRankUrl = profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl;
    if (csRankUrl) {
      list.push({
        id: "rank_cs",
        name: `Lencana CS (${profile.ranks?.cs?.tier || "Platinum"})`,
        category: "rank",
        categoryLabel: "Rank Clash Squad",
        url: csRankUrl,
        rawId: profile.ranks?.cs?.rankId || "CS",
        fileFormat: "PNG",
      });
    }

    // 5. Prime Image Badge
    const primeUrl = profile.assets?.primeImage?.url || profile.prime?.image;
    if (primeUrl) {
      list.push({
        id: "prime_badge",
        name: `Lencana Prime Lv.${profile.prime?.level || 2}`,
        category: "prime",
        categoryLabel: "Lencana Prime",
        url: primeUrl,
        rawId: profile.prime?.level || 2,
        fileFormat: "PNG",
      });
    }

    // 6. Pet Skin
    const petUrl = profile.assets?.pet?.url;
    if (petUrl) {
      list.push({
        id: "pet_skin",
        name: `Skin Pet (${profile.pet?.name || "Pet Companion"})`,
        category: "pet",
        categoryLabel: "Skin Pet",
        url: petUrl,
        rawId: profile.assets?.pet?.id || profile.pet?.skinId || 1310000093,
        fileFormat: "PNG",
      });
    }

    // 7. Pin Profil
    const pinUrl = profile.assets?.pin?.url;
    if (pinUrl) {
      list.push({
        id: "profile_pin",
        name: `Pin Profil Akun`,
        category: "pin",
        categoryLabel: "Pin Profil",
        url: pinUrl,
        rawId: profile.assets?.pin?.id || 910040001,
        fileFormat: "PNG",
      });
    }

    // 8. Clothes (Outfits)
    if (profile.assets?.clothes && Array.isArray(profile.assets.clothes)) {
      profile.assets.clothes.forEach((cloth, idx) => {
        if (cloth.url) {
          list.push({
            id: `clothes_${cloth.id}_${idx}`,
            name: `Outfit Bundle #${cloth.id}`,
            category: "clothes",
            categoryLabel: "Koleksi Baju",
            url: cloth.url,
            rawId: cloth.id,
            fileFormat: "PNG",
          });
        }
      });
    }

    // 9. Weapon Skins
    if (profile.assets?.weaponSkins && Array.isArray(profile.assets.weaponSkins)) {
      profile.assets.weaponSkins.forEach((wp, idx) => {
        if (wp.url) {
          list.push({
            id: `weapon_${wp.id}_${idx}`,
            name: `Skin Senjata #${wp.id}`,
            category: "weapon",
            categoryLabel: "Skin Senjata",
            url: wp.url,
            rawId: wp.id,
            fileFormat: "PNG",
          });
        }
      });
    }

    // 10. Captain & Discord Badge assets
    if (discordData?.embeds && Array.isArray(discordData.embeds)) {
      discordData.embeds.forEach((emb, i) => {
        if (emb.thumbnail?.url && !list.some((it) => it.url === emb.thumbnail?.url)) {
          list.push({
            id: `discord_thumb_${i}`,
            name: emb.title ? `Avatar: ${emb.title}` : `Thumbnail #${i + 1}`,
            category: "discord",
            categoryLabel: "Captain Guild",
            url: emb.thumbnail.url,
            fileFormat: "PNG",
          });
        }
        if (emb.author?.icon_url && !list.some((it) => it.url === emb.author?.icon_url)) {
          list.push({
            id: `discord_badge_ugc_${i}`,
            name: `Lencana UI Badge UGC`,
            category: "discord",
            categoryLabel: "Badge Resource",
            url: emb.author.icon_url,
            fileFormat: "PNG",
          });
        }
        if (emb.footer?.icon_url && !list.some((it) => it.url === emb.footer?.icon_url)) {
          list.push({
            id: `discord_level_icon_${i}`,
            name: `Icon Level Garena`,
            category: "discord",
            categoryLabel: "Level Resource",
            url: emb.footer.icon_url,
            fileFormat: "PNG",
          });
        }
      });
    }

    return list;
  }, [profile, discordData]);

  // Filtered asset list
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
    setGeneratedCardPng(null);

    try {
      let data: FreeFireStalkerResponse | null = null;

      // 1. Try local server route first
      try {
        const localRes = await axios.get<FreeFireStalkerResponse>(
          `/api/stalker/ff?id=${encodeURIComponent(targetUid)}`,
          { signal: abortControllerRef.current.signal }
        );
        data = localRes.data;
      } catch (err: any) {
        if (err.name === "CanceledError") return;
        // 2. Fallback to direct NexaDev proxy
        const fallbackUrl = `https://api.nexadev.my.id/api/ff?id=${encodeURIComponent(targetUid)}`;
        data = await fetchProxiedJson<FreeFireStalkerResponse>(fallbackUrl);
      }

      // If network fails but user entered the sample UID, fallback to sample data smoothly
      if ((!data || !data.ok || !data.profile) && targetUid === "7606762852") {
        data = SAMPLE_DATA;
      }

      if (data && data.ok && data.profile) {
        setProfile(data.profile);
        if (data.discord) {
          setDiscordData(sanitizeDiscordData(data.discord));
        }

        // Convert response into PNG card immediately
        setIsGeneratingPng(true);
        try {
          const pngUrl = await renderFFStalkerCard(data.profile);
          setGeneratedCardPng(pngUrl);
        } catch (canvasErr: any) {
          console.warn("Gagal membuat canvas PNG:", canvasErr);
        } finally {
          setIsGeneratingPng(false);
        }
      } else {
        setError(data?.message || "Akun Free Fire tidak ditemukan. Periksa kembali UID.");
      }
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      if (targetUid === "7606762852") {
        setProfile(SAMPLE_DATA.profile!);
        setDiscordData(sanitizeDiscordData(SAMPLE_DATA.discord));
        setIsGeneratingPng(true);
        try {
          const pngUrl = await renderFFStalkerCard(SAMPLE_DATA.profile!);
          setGeneratedCardPng(pngUrl);
        } catch (canvasErr) {
          console.warn("Gagal membuat canvas:", canvasErr);
        } finally {
          setIsGeneratingPng(false);
        }
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
    setProfile(SAMPLE_DATA.profile!);
    setDiscordData(sanitizeDiscordData(SAMPLE_DATA.discord));
    setActiveTab("assets");

    setIsGeneratingPng(true);
    renderFFStalkerCard(SAMPLE_DATA.profile!)
      .then((pngUrl) => setGeneratedCardPng(pngUrl))
      .catch((err) => console.warn(err))
      .finally(() => setIsGeneratingPng(false));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Convert an image URL through canvas into an authentic PNG Blob and trigger download
  const convertAndDownloadSinglePng = async (asset: ExtractedPngAsset) => {
    setConvertingId(asset.id);
    const cleanFilename = `ff_${asset.category}_${asset.rawId || asset.id}.png`;

    try {
      const proxiedUrl = getProxiedImageUrl(asset.url);
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Gagal memuat gambar"));
        img.src = proxiedUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 300;
      canvas.height = img.naturalHeight || 300;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context tidak tersedia");

      // Draw preserving full transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          triggerDownload(blobUrl, cleanFilename);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } else {
          // Fallback direct download
          triggerDownload(getProxiedImageUrl(asset.url, true, cleanFilename), cleanFilename);
        }
        setConvertingId(null);
      }, "image/png", 1.0);
    } catch (err) {
      console.warn("Canvas conversion fallback:", err);
      // Fallback
      triggerDownload(getProxiedImageUrl(asset.url, true, cleanFilename), cleanFilename);
      setConvertingId(null);
    }
  };

  // Bulk convert & download all PNG assets in a single .ZIP file
  const handleDownloadAllZip = async () => {
    if (!profile || extractedAssets.length === 0) return;
    setIsZipping(true);
    setZipProgress(`Menyiapkan ${extractedAssets.length} aset PNG...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`ff_assets_${profile.uid}`);

      let successCount = 0;
      for (let i = 0; i < extractedAssets.length; i++) {
        const item = extractedAssets[i];
        setZipProgress(`Mengonversi & menambahkan (${i + 1}/${extractedAssets.length}): ${item.name}...`);

        try {
          const proxiedUrl = getProxiedImageUrl(item.url);
          const resp = await axios.get(proxiedUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
          });

          // Filename
          const filename = `${item.category}_${item.rawId || i + 1}.png`;
          folder?.file(filename, resp.data);
          successCount++;
        } catch (itemErr) {
          console.warn(`Gagal memuat aset ${item.name}:`, itemErr);
        }
      }

      setZipProgress(`Mengompresi ke file ZIP...`);
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      triggerDownload(zipUrl, `ff_assets_${profile.uid}_all_png.zip`);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 15000);

      setZipProgress(`Selesai! Berhasil mengunduh ${successCount} file PNG.`);
      setTimeout(() => {
        setIsZipping(false);
        setZipProgress("");
      }, 2500);
    } catch (zipErr: any) {
      console.error("Gagal membuat zip:", zipErr);
      alert("Gagal mengunduh ZIP aset. Silakan unduh per file secara individual.");
      setIsZipping(false);
      setZipProgress("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm mb-1">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>Gaming Intelligence & Asset Extractor</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Stalker Free Fire</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Lacak akun Free Fire berdasarkan UID, tampilkan dan konversi seluruh aset PNG (Avatar, Rank BR/CS, Prime, Baju, Senjata, Pet), serta kartu profil HD siap unduh.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSearch}
        className="bg-slate-50/50 dark:bg-[#121214] p-5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xs space-y-4"
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              User ID (UID) Free Fire <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={loadSampleData}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Contoh UID: 7606762852 (Bsk.MoBilMBg)
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Masukkan UID FF (contoh: 7606762852)"
              value={uid}
              onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Otomatis ekstrak PNG transparan & konversi canvas instan</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadSampleData}
              className="px-4 py-2.5 bg-slate-100 dark:bg-[#202024] hover:bg-slate-200 dark:hover:bg-[#2c2c30] text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Muat Data Contoh
            </button>
            <button
              type="submit"
              disabled={isLoading || !uid}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:opacity-95 active:scale-98 text-white font-semibold rounded-xl shadow-md hover:shadow-orange-500/20 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengambil Data & Ekstrak PNG...</span>
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
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Results */}
      {profile && (
        <div className="space-y-6">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "assets"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Semua Aset PNG ({extractedAssets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("card")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "card"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Kartu Profil HD</span>
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "details"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Ringkasan Akun</span>
            </button>
            <button
              onClick={() => setActiveTab("ranks")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "ranks"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Rank BR & CS</span>
            </button>
            <button
              onClick={() => setActiveTab("clan")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "clan"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Guild & Pet</span>
            </button>
            {discordData?.embeds && discordData.embeds.length > 0 && (
              <button
                onClick={() => setActiveTab("discord")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === "discord"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]"
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>Discord Embed</span>
              </button>
            )}
          </div>

          {/* TAB 1: SEMUA ASET PNG (KOLEKSI LENGKAP & CONVERT) */}
          {activeTab === "assets" && (
            <div className="space-y-4">
              {/* Asset Control Header Bar */}
              <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                      {extractedAssets.length} Aset PNG Terdeteksi
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Transparan • Lossless</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    Galeri & Konverter Koleksi PNG Free Fire
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Seluruh item pakaian, skin senjata, badge rank, avatar, dan prime diekstrak dalam format PNG transparan berkualitas tinggi.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isZipping || extractedAssets.length === 0}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengemas ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" />
                        <span>Unduh Semua PNG (.ZIP)</span>
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

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: "all", label: `Semua (${extractedAssets.length})` },
                  { key: "clothes", label: "Pakaian / Clothes", icon: Shirt },
                  { key: "weapon", label: "Skin Senjata", icon: Crosshair },
                  { key: "rank", label: "Rank BR & CS", icon: Trophy },
                  { key: "avatar", label: "Avatar & Profil", icon: ImageIcon },
                  { key: "prime", label: "Prime Badge", icon: Crown },
                  { key: "pet", label: "Pet Companion", icon: Sparkles },
                  { key: "discord", label: "Captain / Badges", icon: Users },
                ].map((f) => {
                  const Icon = f.icon;
                  const count = f.key === "all" ? extractedAssets.length : extractedAssets.filter((a) => a.category === f.key).length;
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
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Asset Grid Display */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredAssets.map((asset) => {
                  const isThisConverting = convertingId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      className="bg-white dark:bg-[#121214] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                    >
                      {/* Thumbnail Container with transparent checkerboard pattern */}
                      <div
                        onClick={() => setPreviewModalAsset(asset)}
                        className="relative aspect-square w-full flex items-center justify-center p-3 cursor-pointer overflow-hidden bg-slate-100 dark:bg-[#18181b]"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.04) 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }}
                      >
                        <img
                          src={getProxiedImageUrl(asset.url)}
                          alt={asset.name}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                          className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                        />

                        {/* Category badge */}
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                          {asset.categoryLabel}
                        </span>

                        {/* Format badge */}
                        <span className="absolute top-2 right-2 text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-amber-500/90 text-black">
                          PNG
                        </span>
                      </div>

                      {/* Info & Action Controls */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={asset.name}>
                            {asset.name}
                          </h4>
                          {asset.rawId && (
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              ID: {asset.rawId}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                          {/* Convert & Download */}
                          <button
                            onClick={() => convertAndDownloadSinglePng(asset)}
                            disabled={isThisConverting}
                            title="Unduh file PNG asli"
                            className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isThisConverting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>Unduh</span>
                          </button>

                          {/* Copy URL */}
                          <button
                            onClick={() => handleCopy(asset.url, asset.id)}
                            title="Salin URL Gambar PNG"
                            className="w-full py-1.5 px-2 bg-slate-100 dark:bg-[#1c1c1e] hover:bg-slate-200 dark:hover:bg-[#28282c] text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {copiedText === asset.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedText === asset.id ? "Tersalin" : "Link"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PNG CARD (Konversi ke PNG) */}
          {activeTab === "card" && (
            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                      ✓ Konversi Otomatis PNG
                    </span>
                    <span className="text-xs text-slate-400">1200 × 675 PX (HD)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Kartu Gamer Free Fire Siap Unduh</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hasil konversi visual profil lengkap dengan badge rank BR/CS, prime badge, outfit bundle, dan valuasi akun.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (generatedCardPng && profile) {
                        triggerDownload(generatedCardPng, `ff_profile_${profile.uid}_${Date.now()}.png`);
                      }
                    }}
                    disabled={!generatedCardPng || isGeneratingPng}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh PNG HD</span>
                  </button>
                </div>
              </div>

              {/* PNG Canvas Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 dark:border-white/10 flex items-center justify-center min-h-[280px]">
                {isGeneratingPng ? (
                  <div className="flex flex-col items-center justify-center p-8 text-amber-400 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs font-semibold">Mengonversi data respons menjadi kartu PNG HD...</p>
                  </div>
                ) : generatedCardPng ? (
                  <img
                    src={generatedCardPng}
                    alt={`FF Profile ${profile.nickname}`}
                    className="w-full h-auto object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="text-slate-400 text-xs p-6 text-center">
                    Gagal merender kartu PNG. Silakan tinjau tab aset untuk mengunduh PNG per item.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RINGKASAN AKUN */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  {/* Avatar with Level Badge */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 p-1 shadow-md">
                      <img
                        src={
                          profile.avatar?.url ||
                          profile.assets?.avatar?.url ||
                          "https://ff.garena.com/avatar/default.png"
                        }
                        alt={profile.nickname}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                        className="w-full h-full object-cover rounded-xl bg-slate-900"
                      />
                    </div>
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-md shadow-xs">
                      Lv.{profile.level}
                    </span>
                  </div>

                  {/* Title & Nick */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {profile.nickname}
                      </h3>
                      {profile.prime?.level && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-md border border-amber-200 dark:border-amber-800/40">
                          👑 Prime Lv.{profile.prime.level}
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
                        {copiedText === "uid" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedText === "uid" ? "Tersalin" : "Salin UID"}</span>
                      </button>
                      <span>•</span>
                      <span>Season {profile.seasonId || 53}</span>
                      <span>•</span>
                      <span>Versi {profile.releaseVersion || "OB54"}</span>
                    </div>

                    {profile.signature && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/50 dark:bg-[#1c1c1e] p-2 rounded-lg border border-amber-100/50 dark:border-white/10 mt-2">
                        &ldquo;{profile.signature}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick 4 Stats Grid */}
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
                      {profile.dates?.accountAgeText || "3 tahun"}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {profile.dates?.createdAtText || "2023"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-[#1c1c1e] rounded-xl border border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      <span>Estimasi Topup</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      {profile.estimate?.text || "Rp 600.000"}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      ~{profile.estimate?.diamonds || 390} Diamonds (${profile.estimate?.usd || "34.22"})
                    </p>
                  </div>
                </div>

                {/* Additional Info details */}
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
            </div>
          )}

          {/* TAB 4: RANKS BR & CS */}
          {activeTab === "ranks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Battle Royale */}
              <div className="bg-white dark:bg-[#121214] rounded-2xl border border-amber-200/80 dark:border-amber-800/40 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>Battle Royale (BR)</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold border border-transparent dark:border-amber-800/40">
                    Rank ID: {profile.ranks?.br?.rankId || 301}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 p-2 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-800/30">
                    {profile.assets?.brRankImage || profile.ranks?.br?.imageUrl ? (
                      <img
                        src={getProxiedImageUrl(profile.assets?.brRankImage || profile.ranks?.br?.imageUrl || "")}
                        alt="BR Rank"
                        className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                      />
                    ) : (
                      <span className="text-3xl">🏆</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      {profile.ranks?.br?.tier || "Bronze I"}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      Points: {profile.ranks?.br?.pointsText || profile.ranks?.br?.points || "1.000"} pts
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Tampil di profil: {profile.ranks?.br?.showInProfile ? "Ya" : "Tidak"} • Max Rank:{" "}
                      {profile.ranks?.br?.maxRank || 301}
                    </p>
                  </div>
                </div>

                {(profile.assets?.brRankImage || profile.ranks?.br?.imageUrl) && (
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-end">
                    <button
                      onClick={() => {
                        const url = profile.assets?.brRankImage || profile.ranks?.br?.imageUrl;
                        if (url) {
                          convertAndDownloadSinglePng({
                            id: "rank_br",
                            name: `BR_${profile.ranks?.br?.tier}`,
                            category: "rank",
                            categoryLabel: "Rank BR",
                            url,
                            fileFormat: "PNG",
                          });
                        }
                      }}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Lencana BR (PNG)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Clash Squad */}
              <div className="bg-white dark:bg-[#121214] rounded-2xl border border-purple-200/80 dark:border-purple-800/40 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Clash Squad (CS)</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-semibold border border-transparent dark:border-purple-800/40">
                    Rank ID: {profile.ranks?.cs?.rankId || 311}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-20 h-20 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 p-2 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/30">
                    {profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl ? (
                      <img
                        src={getProxiedImageUrl(profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl || "")}
                        alt="CS Rank"
                        className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                      />
                    ) : (
                      <span className="text-3xl">⚔️</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                      {profile.ranks?.cs?.tier || "Platinum"}
                    </h4>
                    <p className="text-xs text-purple-700 dark:text-purple-400 font-bold">
                      ⭐ {profile.ranks?.cs?.star || 2} Star • Points: {profile.ranks?.cs?.points || 38}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Tampil di profil: {profile.ranks?.cs?.showInProfile ? "Ya" : "Tidak"} • Max Rank:{" "}
                      {profile.ranks?.cs?.maxRank || 311}
                    </p>
                  </div>
                </div>

                {(profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl) && (
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex justify-end">
                    <button
                      onClick={() => {
                        const url = profile.assets?.csRankImage || profile.ranks?.cs?.imageUrl;
                        if (url) {
                          convertAndDownloadSinglePng({
                            id: "rank_cs",
                            name: `CS_${profile.ranks?.cs?.tier}`,
                            category: "rank",
                            categoryLabel: "Rank CS",
                            url,
                            fileFormat: "PNG",
                          });
                        }
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Lencana CS (PNG)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: GUILD & PET */}
          {activeTab === "clan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <span className="font-bold text-slate-800 dark:text-slate-200">{profile.clan.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Guild ID:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{profile.clan.id}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Level Guild:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">Level {profile.clan.level}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Kapasitas Anggota:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {profile.clan.memberNum} / {profile.clan.capacity} Member
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Captain UID:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{profile.clan.captainId}</span>
                      </div>
                    </div>

                    {/* Captain Guild Info (if available from Discord embeds) */}
                    {discordData?.embeds?.[1] && (
                      <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                        <div className="flex items-center gap-3">
                          {discordData.embeds[1].thumbnail?.url && (
                            <img
                              src={getProxiedImageUrl(discordData.embeds[1].thumbnail.url)}
                              alt="Captain"
                              className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-amber-500/40 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                              Captain Guild
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {discordData.embeds[1].title || "Captain"}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-mono">UID: {profile.clan.captainId}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Akun ini belum bergabung ke dalam Guild.</p>
                )}
              </div>

              {/* Pet Info with PNG Skin Preview */}
              <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm pb-2 border-b border-black/5 dark:border-white/10">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Pet Companion</span>
                </div>

                {profile.pet?.name ? (
                  <div className="space-y-4">
                    {/* Pet Visual Preview */}
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
                        <div className="w-20 h-20 rounded-xl bg-amber-500/10 flex items-center justify-center text-3xl shrink-0">
                          🦅
                        </div>
                      )}
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{profile.pet.name}</h4>
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
                        <span className="font-mono text-slate-800 dark:text-slate-200">{profile.pet.skinId}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Pet Base ID:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{profile.pet.id}</span>
                      </div>
                    </div>

                    {profile.assets?.pet?.url && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (profile.assets?.pet?.url) {
                              convertAndDownloadSinglePng({
                                id: "pet_skin",
                                name: `pet_${profile.pet?.name}`,
                                category: "pet",
                                categoryLabel: "Skin Pet",
                                url: profile.assets.pet.url,
                                rawId: profile.pet?.skinId,
                                fileFormat: "PNG",
                              });
                            }
                          }}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Skin Pet (PNG)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Tidak ada data pet aktif.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: DISCORD WEBHOOK EMBED */}
          {activeTab === "discord" && discordData?.embeds && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-white/10 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Format Embed Discord</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Payload siap pakai untuk webhook notifikasi server Discord.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify(discordData.embeds, null, 2), "discord_json")}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                  >
                    {copiedText === "discord_json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === "discord_json" ? "JSON Tersalin" : "Salin JSON Embed"}</span>
                  </button>
                </div>

                <div className="space-y-4 mt-4">
                  {discordData.embeds.map((emb, idx) => (
                    <div
                      key={idx}
                      className="bg-[#2f3136] text-white p-4 rounded-xl border-l-4 space-y-3 font-sans"
                      style={{ borderColor: emb.color ? `#${emb.color.toString(16).padStart(6, "0")}` : "#f59e0b" }}
                    >
                      {/* Author */}
                      {emb.author && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          {emb.author.icon_url && (
                            <img src={getProxiedImageUrl(emb.author.icon_url)} alt="Icon" className="w-4 h-4 rounded-full" />
                          )}
                          <span>
                            {emb.author.name
                              ?.replace(/NOTIF ADENPEDIA CEK FF/gi, "NOTIF FIXIO CEK FF")
                              ?.replace(/ADENPEDIA/gi, "FIXIO")}
                          </span>
                        </div>
                      )}

                      {/* Title & Desc */}
                      <div className="flex items-start justify-between gap-3">
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

                      {/* Fields */}
                      {emb.fields && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
                          {emb.fields.map((f, fi) => (
                            <div key={fi} className="p-1.5 bg-black/20 rounded-md">
                              <span className="text-slate-400 font-semibold block text-[11px]">{f.name}</span>
                              <span className="text-white font-medium text-xs">{f.value.replace(/\*\*/g, "")}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      {emb.footer && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                          {emb.footer.icon_url && (
                            <img src={getProxiedImageUrl(emb.footer.icon_url)} alt="Icon" className="w-3.5 h-3.5 rounded-full" />
                          )}
                          <span>
                            {emb.footer.text?.replace(/adenpedia\.my\.id/gi, "api.nexadev.my.id")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Asset Preview Lightbox Modal */}
      {previewModalAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalAsset(null)}
        >
          <div
            className="bg-white dark:bg-[#121214] rounded-2xl border border-black/10 dark:border-white/15 max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  {previewModalAsset.categoryLabel}
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

            {/* Checkerboard container */}
            <div
              className="aspect-square w-full rounded-xl flex items-center justify-center p-6 bg-slate-100 dark:bg-[#18181b]"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.05) 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }}
            >
              <img
                src={getProxiedImageUrl(previewModalAsset.url)}
                alt={previewModalAsset.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-lg"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => convertAndDownloadSinglePng(previewModalAsset)}
                className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:opacity-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PNG Transparan</span>
              </button>
              <button
                onClick={() => handleCopy(previewModalAsset.url, "modal_copy")}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#28282c]"
              >
                {copiedText === "modal_copy" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText === "modal_copy" ? "Tersalin" : "Salin URL"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
