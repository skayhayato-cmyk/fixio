import React, { useState, useRef } from "react";
import {
  Gamepad2,
  Search,
  Download,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Users,
  Eye,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  Layers,
  Box,
  Coins,
} from "lucide-react";
import axios from "axios";
import { fetchProxiedJson, triggerDownload } from "../../services/api";
import { renderRobloxStalkerCard } from "../../services/canvasGenerators";
import { RobloxStalkerResponse, RobloxProfileData } from "../../types";

export const RobloxStalkerTool: React.FC = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Result state
  const [data, setData] = useState<RobloxProfileData | null>(null);
  const [generatedCardPng, setGeneratedCardPng] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"card" | "details" | "games" | "inventory">("card");

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = async (e?: React.FormEvent, customUsername?: string) => {
    if (e) e.preventDefault();
    const cleanUsername = (customUsername || username).replace(/^@/, "").trim();
    if (!cleanUsername) {
      setError("Masukkan username Roblox.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);
    setIsLoading(true);
    setData(null);
    setGeneratedCardPng(null);

    try {
      let resData: RobloxStalkerResponse | null = null;

      // 1. Try local route first
      try {
        const localRes = await axios.get<RobloxStalkerResponse>(
          `/api/stalker/roblox?username=${encodeURIComponent(cleanUsername)}`,
          { signal: abortControllerRef.current.signal }
        );
        resData = localRes.data;
      } catch (err: any) {
        if (err.name === "CanceledError") return;
        // Fallback to proxy
        const fallbackUrl = `https://api.nexadev.my.id/api/roblox?username=${encodeURIComponent(cleanUsername)}`;
        resData = await fetchProxiedJson<RobloxStalkerResponse>(fallbackUrl);
      }

      if (resData && (resData.status || (resData as any).ok) && resData.data) {
        setData(resData.data);

        // Convert response into PNG card immediately as requested
        setIsGeneratingPng(true);
        try {
          const pngUrl = await renderRobloxStalkerCard(resData.data);
          setGeneratedCardPng(pngUrl);
        } catch (canvasErr: any) {
          console.warn("Gagal membuat canvas PNG Roblox:", canvasErr);
        } finally {
          setIsGeneratingPng(false);
        }
      } else {
        setError(resData?.message || "Pengguna Roblox tidak ditemukan. Periksa kembali username.");
      }
    } catch (err: any) {
      if (err.name === "CanceledError") return;
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Gagal mengambil data akun Roblox. Pastikan username tepat dan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadPng = () => {
    if (generatedCardPng && data) {
      triggerDownload(generatedCardPng, `roblox_${data.name}_profile_${Date.now()}.png`);
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "-";
    try {
      return new Date(isoStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-cyan-600 font-semibold text-sm mb-1">
          <Gamepad2 className="w-4 h-4" />
          <span>Roblox Profile Intelligence</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stalker Roblox</h2>
        <p className="text-slate-500 text-sm mt-1">
          Lacak profil Roblox, otomatis konversi kartu profil PNG beresolusi tinggi, serta tampilkan avatar, teman, follower, daftar tempat permainan, dan item koleksi.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4"
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              Username Roblox <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setUsername("Linkmon99");
                handleSearch(undefined, "Linkmon99");
              }}
              className="text-xs text-cyan-600 hover:text-cyan-700 font-medium underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Contoh: Linkmon99
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
              @
            </div>
            <input
              type="text"
              required
              placeholder="contoh: Linkmon99 atau builderman"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !username}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:opacity-95 active:scale-98 text-white font-semibold rounded-xl shadow-md hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengambil Data & Konversi PNG...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Stalk Profil Roblox</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Profile Results */}
      {data && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("card")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "card"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kartu Profil PNG (HD)</span>
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "details"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rincian & Statistik Akun</span>
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "games"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Daftar Game ({data.games?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "inventory"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Inventory & Koleksi ({data.inventory?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: PNG CARD (Konversi ke PNG) */}
          {activeTab === "card" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                      ✓ Konversi Otomatis PNG
                    </span>
                    <span className="text-xs text-slate-400">1200 × 675 PX (HD)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">Kartu Gamer Roblox Siap Unduh</h3>
                  <p className="text-xs text-slate-500">
                    Visualisasi profil rapi mencakup avatar headshot, bio, follower, serta daftar tempat populer.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPng}
                    disabled={!generatedCardPng || isGeneratingPng}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh PNG (HD)</span>
                  </button>
                </div>
              </div>

              {/* PNG Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[260px]">
                {isGeneratingPng ? (
                  <div className="flex flex-col items-center justify-center p-8 text-cyan-400 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs font-semibold">Mengonversi data respons menjadi PNG...</p>
                  </div>
                ) : generatedCardPng ? (
                  <img
                    src={generatedCardPng}
                    alt={`Roblox Profile ${data.name}`}
                    className="w-full h-auto object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="text-slate-400 text-xs p-6 text-center">
                    Gagal merender kartu PNG. Silakan tinjau tab rincian akun.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RINCIAN & STATISTIK AKUN */}
          {(activeTab === "details" || activeTab === "card") && (
            <div className="space-y-4">
              {/* Profile Card Header */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-md">
                      <img
                        src={data.avatar || "https://tr.rbxcdn.com/default-avatar"}
                        alt={data.name}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                        className="w-full h-full object-cover rounded-xl bg-slate-900"
                      />
                    </div>
                    {data.isBanned ? (
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-red-600 text-white font-bold text-xs rounded-md shadow-xs">
                        Banned
                      </span>
                    ) : (
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white font-bold text-xs rounded-md shadow-xs">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {data.displayName || data.name}
                      </h3>
                      <span className="text-slate-500 font-medium text-sm">@{data.name}</span>
                      {data.hasVerifiedBadge && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
                          ✓ Terverifikasi
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        ID: {data.id}
                      </span>
                      <button
                        onClick={() => handleCopy(String(data.id), "id")}
                        className="text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {copiedText === "id" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedText === "id" ? "Tersalin" : "Salin ID"}</span>
                      </button>
                      <span>•</span>
                      <span>Bergabung: {formatDate(data.created)}</span>
                    </div>

                    {data.description && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed mt-2">
                        {data.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Social Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs text-slate-500 font-semibold block mb-1">Friends</span>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(data.friends)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs text-slate-500 font-semibold block mb-1">Followers</span>
                    <p className="text-xl font-bold text-cyan-600">{formatNumber(data.followers)}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-xs text-slate-500 font-semibold block mb-1">Following</span>
                    <p className="text-xl font-bold text-slate-900">{formatNumber(data.followings)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR GAME */}
          {activeTab === "games" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Gamepad2 className="w-5 h-5 text-cyan-600" />
                  <span>Daftar Game & Tempat ({data.games?.length || 0})</span>
                </div>
              </div>

              {data.games && data.games.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.games.map((game) => (
                    <div
                      key={game.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-200 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{game.name}</h4>
                        <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                          ID: {game.id}
                        </span>
                      </div>

                      {game.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {game.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <span className="font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                          👀 {formatNumber(game.placeVisits)} Kunjungan
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Dibuat: {formatDate(game.created)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Pengguna ini belum mempublikasikan game atau tempat di Roblox.
                </p>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY & KOLEKSI */}
          {activeTab === "inventory" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Box className="w-5 h-5 text-indigo-600" />
                  <span>Item Koleksi & Inventory ({data.inventory?.length || 0})</span>
                </div>
              </div>

              {data.inventory && data.inventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.inventory.map((item, idx) => (
                    <div
                      key={item.userAssetId || idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{item.assetId}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>RAP (Rata-rata):</span>
                          <span className="font-bold text-emerald-600">
                            {formatNumber(item.recentAveragePrice)} R$
                          </span>
                        </div>
                        {item.originalPrice !== undefined && (
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Harga Asli:</span>
                            <span>{formatNumber(item.originalPrice)} R$</span>
                          </div>
                        )}
                        {item.assetStock !== undefined && (
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Stok Item:</span>
                            <span>{formatNumber(item.assetStock)} pcs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Tidak ada data item koleksi publik yang ditemukan pada akun ini.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
