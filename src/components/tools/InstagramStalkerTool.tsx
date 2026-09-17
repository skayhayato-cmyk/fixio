import React, { useState } from "react";
import { Instagram, Search, CheckCircle2, Lock, Unlock, Download, Users, Image as ImageIcon, Heart, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { fetchProxiedJson, getProxiedImageUrl, triggerDownload } from "../../services/api";
import { InstagramStalkerResponse } from "../../types";

export const InstagramStalkerTool: React.FC = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<InstagramStalkerResponse["data"] | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername) {
      setError("Masukkan username Instagram");
      return;
    }

    setError(null);
    setIsLoading(true);
    setProfile(null);

    try {
      const endpoint = `https://api.nexadev.my.id/api/instagramstalker?username=${encodeURIComponent(cleanUsername)}`;
      const res = await fetchProxiedJson<InstagramStalkerResponse>(endpoint);

      if (res.status && res.data) {
        setProfile(res.data);
      } else {
        setError(res.message || "Pengguna Instagram tidak ditemukan atau profil bersifat sangat privat.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal mengambil data profil Instagram.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAvatar = () => {
    if (profile?.photo) {
      triggerDownload(profile.photo, `ig_${profile.username}_avatar.png`);
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat("id-ID").format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-pink-600 font-semibold text-sm mb-1">
          <Instagram className="w-4 h-4" />
          <span>Social Intelligence Stalker</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Instagram Profile Stalker</h2>
        <p className="text-slate-500 text-sm mt-1">
          Lihat statistik lengkap akun Instagram, verifikasi status akun, bio teks, serta unduh foto profil ukuran penuh (HD).
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSearch} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Username Instagram <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
              @
            </div>
            <input
              type="text"
              required
              placeholder="contoh: zuck atau nexadevv"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !username}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-95 active:scale-98 text-white font-semibold rounded-xl shadow-md hover:shadow-pink-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mencari Profil...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Stalk Profil Instagram</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Pencarian Gagal</p>
            <p className="text-rose-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {profile && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in duration-300">
          {/* Top Banner Gradient */}
          <div className="h-28 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 relative" />

          {/* Profile Content */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 mb-5">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-slate-100 overflow-hidden shrink-0">
                  <img
                    src={profile.photo ? getProxiedImageUrl(profile.photo) : "https://placehold.co/150x150?text=IG"}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {profile.verified && (
                  <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full shadow-sm">
                    <CheckCircle2 className="w-4 h-4 fill-blue-500 text-white" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAvatar}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Foto HD
                </button>
                <a
                  href={`https://instagram.com/${profile.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka di IG
                </a>
              </div>
            </div>

            {/* Names & Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{profile.name || profile.username}</h3>
                {profile.private ? (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Akun Privat
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-semibold rounded-md flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> Akun Publik
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-pink-600 font-mono">@{profile.username}</p>
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="text-slate-700 text-sm mt-3 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {profile.bio}
              </p>
            ) : (
              <p className="text-slate-400 text-xs italic mt-2">Tidak ada deskripsi bio.</p>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-900">{formatNumber(profile.posts)}</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Postingan</div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <div className="flex items-center justify-center text-pink-500 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-900">{formatNumber(profile.followers)}</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Followers</div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <div className="flex items-center justify-center text-slate-400 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-900">{formatNumber(profile.following)}</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Following</div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                <div className="flex items-center justify-center text-rose-500 mb-1">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-slate-900">{formatNumber(profile.likes)}</div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Likes</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
