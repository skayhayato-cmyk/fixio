import React, { useState, useEffect } from "react";
import axios from "axios";
import { Activity, MapPin, Compass, Waves, AlertTriangle, ExternalLink, RefreshCw, Loader2, AlertCircle, ShieldAlert, Calendar, Clock } from "lucide-react";
import { getProxiedImageUrl } from "../../services/api";
import { GempaResponse } from "../../types";

export const InfoGempaTool: React.FC = () => {
  const [data, setData] = useState<GempaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchGempa = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<GempaResponse>("/api/gempa", { timeout: 12000 });
      const res = response.data;
      if (res.earthquake || res.status === "success") {
        setData(res);
        setLastRefreshed(new Date());
      } else {
        setError(res.message || "Gagal memuat data gempa terkini.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal menghubungi server data gempa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGempa();
  }, []);

  const eq = data?.earthquake;
  const magnitude = Number(eq?.magnitude) || 0;

  const getMagnitudeBadge = (mag: number) => {
    if (mag >= 6.0) {
      return { bg: "bg-red-500 text-white", label: "Gempa Kuat", border: "border-red-600" };
    } else if (mag >= 5.0) {
      return { bg: "bg-orange-500 text-white", label: "Gempa Sedang", border: "border-orange-600" };
    } else {
      return { bg: "bg-emerald-500 text-white", label: "Gempa Ringan", border: "border-emerald-600" };
    }
  };

  const badge = getMagnitudeBadge(magnitude);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>BMKG Realtime Seismic Monitor</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Info Gempa Bumi Terkini Indonesia</h2>
          <p className="text-slate-500 text-sm mt-1">
            Pantau informasi gempa bumi terbaru yang dirasakan di seluruh wilayah Indonesia langsung dari sensor BMKG.
          </p>
        </div>

        <button
          onClick={fetchGempa}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading && !data && (
        <div className="p-12 bg-white rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-sm font-semibold text-slate-700">Mengambil data seismik BMKG...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal Memuat Data</p>
            <p className="text-rose-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main Earthquake Card */}
      {eq && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Top Stat Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-2xl font-black text-rose-600 leading-none">{eq.magnitude}</span>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mt-1">Magnitudo</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {eq.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{eq.location}</h3>
                </div>
              </div>

              {eq.map_url && (
                <a
                  href={eq.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <MapPin className="w-4 h-4" /> Buka Lokasi di Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal
                </div>
                <div className="text-sm font-bold text-slate-900">{eq.date}</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5" /> Waktu Terjadinya
                </div>
                <div className="text-sm font-bold text-slate-900">{eq.time}</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                  <Waves className="w-3.5 h-3.5" /> Kedalaman
                </div>
                <div className="text-sm font-bold text-slate-900">{eq.depth}</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-1">
                  <Compass className="w-3.5 h-3.5" /> Koordinat
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono text-xs">
                  {eq.coordinates?.latitude_string || `${eq.coordinates?.latitude}°`},{" "}
                  {eq.coordinates?.longitude_string || `${eq.coordinates?.longitude}°`}
                </div>
              </div>
            </div>

            {/* Potential & Felt zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Potensi & Dampak
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {eq.potential || "Tidak berpotensi tsunami"}
                </p>
              </div>

              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs mb-1">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Wilayah yang Merasakan (Skala MMI)
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                  {eq.felt || "Dirasakan di sekitar pusat gempa"}
                </p>
              </div>
            </div>

            {/* Shakemap Image */}
            {(eq.shakemap || eq.shakemap_url) && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Peta Guncangan Seismik (Shakemap BMKG)
                  </h4>
                </div>
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex justify-center">
                  <img
                    src={getProxiedImageUrl(eq.shakemap || eq.shakemap_url!)}
                    alt="BMKG Shakemap"
                    className="max-h-[380px] w-auto rounded-xl shadow-md object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <p className="text-right text-[11px] text-slate-400">
            Terakhir diperbarui: {lastRefreshed.toLocaleTimeString("id-ID")} WIB • Sumber: BMKG / NexaDev
          </p>
        </div>
      )}
    </div>
  );
};
