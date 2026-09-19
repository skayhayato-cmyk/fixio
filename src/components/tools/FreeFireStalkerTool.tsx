import React, { useState, useRef } from "react";
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
} from "lucide-react";
import axios from "axios";
import { fetchProxiedJson, triggerDownload } from "../../services/api";
import { renderFFStalkerCard } from "../../services/canvasGenerators";
import { FreeFireStalkerResponse, FFProfile } from "../../types";

export const FreeFireStalkerTool: React.FC = () => {
  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Result state
  const [profile, setProfile] = useState<FFProfile | null>(null);
  const [generatedCardPng, setGeneratedCardPng] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"card" | "details" | "ranks" | "clan">("card");

  const abortControllerRef = useRef<AbortController | null>(null);

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
    setGeneratedCardPng(null);

    try {
      let data: FreeFireStalkerResponse | null = null;

      // 1. Try local route first
      try {
        const localRes = await axios.get<FreeFireStalkerResponse>(
          `/api/stalker/ff?id=${encodeURIComponent(targetUid)}`,
          { signal: abortControllerRef.current.signal }
        );
        data = localRes.data;
      } catch (err: any) {
        if (err.name === "CanceledError") return;
        // Fallback to proxy
        const fallbackUrl = `https://api.nexadev.my.id/api/ff?id=${encodeURIComponent(targetUid)}`;
        data = await fetchProxiedJson<FreeFireStalkerResponse>(fallbackUrl);
      }

      if (data && data.ok && data.profile) {
        setProfile(data.profile);

        // Convert response into PNG card immediately as requested
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
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Gagal menghubungi server Free Fire. Pastikan UID valid dan coba beberapa saat lagi."
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
    if (generatedCardPng && profile) {
      triggerDownload(generatedCardPng, `ff_profile_${profile.uid}_${Date.now()}.png`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-1">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>Gaming Intelligence Hub</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stalker Free Fire</h2>
        <p className="text-slate-500 text-sm mt-1">
          Lacak statistik lengkap profil Free Fire berdasarkan UID, otomatis konversi ke kartu PNG HD beresolusi tinggi, dan tinjau rank BR/CS, valuasi akun, serta keanggotaan guild.
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
              User ID (UID) Free Fire <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setUid("7606762852");
                handleSearch(undefined, "7606762852");
              }}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Contoh UID: 7606762852
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Masukkan UID FF (contoh: 7606762852)"
              value={uid}
              onChange={(e) => setUid(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !uid}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:opacity-95 active:scale-98 text-white font-semibold rounded-xl shadow-md hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengambil Data & Konversi PNG...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Stalk Profil FF</span>
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
      {profile && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("card")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "card"
                  ? "bg-amber-500 text-white shadow-xs"
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
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Ringkasan Akun</span>
            </button>
            <button
              onClick={() => setActiveTab("ranks")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "ranks"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Rank BR & CS</span>
            </button>
            <button
              onClick={() => setActiveTab("clan")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "clan"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Guild & Pet</span>
            </button>
          </div>

          {/* TAB 1: PNG CARD (Konversi ke PNG) */}
          {activeTab === "card" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      ✓ Konversi Otomatis PNG
                    </span>
                    <span className="text-xs text-slate-400">1200 × 675 PX (HD)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">Kartu Gamer Free Fire Siap Unduh</h3>
                  <p className="text-xs text-slate-500">
                    Hasil konversi visual profil yang rapi, berisi info Nickname, Level, Rank BR/CS, dan valuasi akun.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadPng}
                    disabled={!generatedCardPng || isGeneratingPng}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh PNG (HD)</span>
                  </button>
                </div>
              </div>

              {/* PNG Canvas Preview */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[260px]">
                {isGeneratingPng ? (
                  <div className="flex flex-col items-center justify-center p-8 text-amber-400 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs font-semibold">Mengonversi data respons menjadi PNG...</p>
                  </div>
                ) : generatedCardPng ? (
                  <img
                    src={generatedCardPng}
                    alt={`FF Profile ${profile.nickname}`}
                    className="w-full h-auto object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="text-slate-400 text-xs p-6 text-center">
                    Gagal merender kartu PNG. Silakan tinjau tab rincian profil.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RINGKASAN AKUN (Tata Rapi) */}
          {(activeTab === "details" || activeTab === "card") && (
            <div className="space-y-4">
              {/* Profile Card Summary */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  {/* Avatar */}
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
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {profile.nickname}
                      </h3>
                      {profile.prime?.level && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200">
                          👑 Prime Lv.{profile.prime.level}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        {profile.server || profile.region || "ID"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        UID: {profile.uid}
                      </span>
                      <button
                        onClick={() => handleCopy(profile.uid, "uid")}
                        className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 cursor-pointer"
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
                      <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 mt-2">
                        &ldquo;{profile.signature}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick 4 Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Total Likes</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {profile.likesText || profile.likes?.toLocaleString("id-ID") || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Credit Score</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {profile.creditScore?.value ?? 100} / 100
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Umur Akun</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {profile.dates?.accountAgeText || "3 tahun"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {profile.dates?.createdAtText || "2023"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                      <span>Estimasi Akun</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 truncate">
                      {profile.estimate?.text || "Rp 600.000"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ~{profile.estimate?.diamonds || 390} Diamonds
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RANKS BR & CS */}
          {activeTab === "ranks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Battle Royale */}
              <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>Battle Royale (BR)</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
                    Rank ID: {profile.ranks?.br?.rankId || 301}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center text-3xl shrink-0">
                    🏆
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">
                      {profile.ranks?.br?.tier || "Bronze I"}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Points: {profile.ranks?.br?.pointsText || profile.ranks?.br?.points || "1.000"} pts
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tampil di profil: {profile.ranks?.br?.showInProfile ? "Ya" : "Tidak"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clash Squad */}
              <div className="bg-white rounded-2xl border border-purple-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Clash Squad (CS)</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                    Rank ID: {profile.ranks?.cs?.rankId || 311}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center text-3xl shrink-0">
                    ⚔️
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">
                      {profile.ranks?.cs?.tier || "Platinum"}
                    </h4>
                    <p className="text-xs text-purple-700 font-bold">
                      ⭐ {profile.ranks?.cs?.star || 2} Star • Points: {profile.ranks?.cs?.points || 38}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tampil di profil: {profile.ranks?.cs?.showInProfile ? "Ya" : "Tidak"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GUILD & PET */}
          {activeTab === "clan" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clan Info */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm pb-2 border-b border-slate-100">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Clan / Guild Terdaftar</span>
                </div>

                {profile.clan?.name ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Nama Guild:</span>
                      <span className="font-bold text-slate-800">{profile.clan.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Guild ID:</span>
                      <span className="font-mono text-slate-800">{profile.clan.id}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Level Guild:</span>
                      <span className="font-bold text-amber-600">Level {profile.clan.level}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Kapasitas Anggota:</span>
                      <span className="font-semibold text-slate-800">
                        {profile.clan.memberNum} / {profile.clan.capacity} Member
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Captain UID:</span>
                      <span className="font-mono text-slate-700">{profile.clan.captainId}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Akun ini belum bergabung ke dalam Guild.</p>
                )}
              </div>

              {/* Pet Info */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm pb-2 border-b border-slate-100">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Pet Companion</span>
                </div>

                {profile.pet?.name ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Nama Pet:</span>
                      <span className="font-bold text-slate-800">{profile.pet.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Level:</span>
                      <span className="font-bold text-amber-600">Level {profile.pet.level}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Exp Pet:</span>
                      <span className="text-slate-800">{profile.pet.exp} EXP</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Status Dipakai:</span>
                      <span className="font-semibold text-emerald-600">
                        {profile.pet.selected ? "Aktif / Terpilih" : "Disimpan"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Tidak ada data pet aktif.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
