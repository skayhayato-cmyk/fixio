import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

/**
 * Normalizes user input into a clean Spotify track URL without tracking parameters
 */
function sanitizeSpotifyUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();

  // 1. Match standard 22-character Spotify track ID
  const trackIdMatch = trimmed.match(/(?:track\/|track:|^)([a-zA-Z0-9]{22})(?:[/?#\s]|$)/);
  if (trackIdMatch && trackIdMatch[1]) {
    return `https://open.spotify.com/track/${trackIdMatch[1]}`;
  }

  // 2. Parse URL and strip tracking parameters
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      if (u.hostname.includes("spotify.com")) {
        u.search = "";
        u.hash = "";
        u.pathname = u.pathname.replace(/^\/intl-[a-z]{2}\/track\//, "/track/");
        return u.toString();
      }
    }
  } catch {
    // Ignore URL parse error
  }

  return trimmed;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawUrl = searchParams.get("url")?.trim();

  if (!rawUrl) {
    return NextResponse.json(
      {
        author: "NexaDev",
        status: false,
        ok: false,
        message: "Parameter URL track Spotify diperlukan.",
      },
      { status: 200 }
    );
  }

  const cleanUrl = sanitizeSpotifyUrl(rawUrl);

  const requestHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  };

  // Endpoints to try (direct trailing-slash first to avoid 301 redirects)
  const candidateEndpoints = [
    `https://api.nexadev.my.id/api/spotify/?url=${encodeURIComponent(cleanUrl)}`,
    `https://api.nexadev.my.id/api/spotify?url=${encodeURIComponent(cleanUrl)}`,
  ];

  let lastResponseData: any = null;
  let lastErrorMessage = "";

  for (const apiUrl of candidateEndpoints) {
    try {
      const response = await axios.get(apiUrl, {
        timeout: 25000,
        headers: requestHeaders,
        maxRedirects: 5,
        validateStatus: () => true, // capture all status codes
      });

      const body = response.data;
      if (body && typeof body === "object") {
        if (body.status === true && body.data) {
          const d = body.data;
          const track = {
            index: 1,
            name: d.title || "Spotify Track",
            artist: d.artist || "Spotify Artist",
            cover: d.thumbnail || "",
            thumbnail: d.thumbnail || "",
            duration: d.duration || "",
            preview: d.preview || "",
            mp3_url: d.url || "",
            url: d.url || "",
          };

          return NextResponse.json({
            author: body.author || "NexaDev",
            status: true,
            ok: true,
            data: d,
            tracks: [track],
          });
        }

        // If NexaDev returned status: false with an explicit message
        if (body.status === false && body.message) {
          lastResponseData = body;
          lastErrorMessage = body.message;
          // If explicitly "Gagal mengambil data", trying without trailing slash might not help, but let's break or check
          if (body.message.includes("Gagal mengambil data")) {
            lastErrorMessage = "Lagu Spotify tidak ditemukan atau link tidak valid pada server NexaDev.";
          }
        }
      }
    } catch (err: any) {
      lastErrorMessage = err?.message || "Koneksi ke API NexaDev terputus";
    }
  }

  // If all attempts failed, return a friendly 200 response with status: false
  return NextResponse.json(
    {
      author: lastResponseData?.author || "NexaDev",
      status: false,
      ok: false,
      message:
        lastErrorMessage ||
        "Gagal memproses lagu dari Spotify. Pastikan link lagu Spotify aktif, bersifat publik, atau coba beberapa saat lagi.",
    },
    { status: 200 }
  );
}
