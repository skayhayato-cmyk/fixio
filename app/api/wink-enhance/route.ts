import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

function isSafePublicUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return false;
    }

    const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4Match) {
      const b1 = parseInt(ipv4Match[1], 10);
      const b2 = parseInt(ipv4Match[2], 10);
      if (b1 === 10 || b1 === 127 || b1 === 0) return false;
      if (b1 === 192 && b2 === 168) return false;
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return false;
      if (b1 === 169 && b2 === 254) return false;
    }

    return true;
  } catch {
    return false;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: NextRequest) {
  try {
    const targetUrl = req.nextUrl.searchParams.get("url");
    if (!targetUrl) {
      return NextResponse.json(
        { status: false, message: "Parameter 'url' diperlukan" },
        { status: 400 }
      );
    }

    if (!isSafePublicUrl(targetUrl)) {
      return NextResponse.json(
        { status: false, message: "URL target tidak valid atau tidak diizinkan." },
        { status: 400 }
      );
    }

    // Notice trailing slash canonical URL for api.nexadev.my.id/api/wink/ to avoid 301 drop
    const winkApiUrl = `https://api.nexadev.my.id/api/wink/?url=${encodeURIComponent(targetUrl)}`;

    let winkResponse: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        if (attempt > 0) await delay(1000 * Math.pow(2, attempt - 1));
        winkResponse = await axios.get(winkApiUrl, {
          timeout: 45000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json, text/plain, */*",
          },
        });
        if (winkResponse?.data) break;
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          break;
        }
      }
    }

    const data = winkResponse?.data;
    const rawResultUrl = data?.resultUrl || data?.result || data?.url || data?.data?.url;

    if (!rawResultUrl) {
      const errMsg =
        data?.message ||
        lastError?.response?.data?.message ||
        "Gagal mendapatkan tautan hasil resolusi HD dari server upstream.";
      return NextResponse.json(
        {
          status: false,
          message: errMsg,
        },
        { status: 422 }
      );
    }

    // Download the HD result from Picsart CDN and inline as base64 for instant preview
    try {
      const imgRes = await axios.get(rawResultUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://picsart.com/",
          Origin: "https://picsart.com",
        },
      });

      const buffer = Buffer.from(imgRes.data);
      const mimeType = (imgRes.headers["content-type"] as string) || "image/png";
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        status: true,
        dataUrl,
        resultUrl: rawResultUrl,
        sizeBytes: buffer.length,
        mimeType: "image/png",
      });
    } catch (imgErr: any) {
      console.warn("Could not inline base64 image, fallback to proxy url:", imgErr.message);
      return NextResponse.json({
        status: true,
        dataUrl: `/api/proxy-image?url=${encodeURIComponent(rawResultUrl)}`,
        resultUrl: rawResultUrl,
        mimeType: "image/png",
      });
    }
  } catch (error: any) {
    console.error("Wink enhance route error:", error?.message);
    const status = error?.response?.status || 502;
    return NextResponse.json(
      {
        status: false,
        message:
          status === 429
            ? "Batas frekuensi tercapai. Silakan tunggu beberapa detik."
            : "Gagal memproses peningkatan kualitas foto. Pastikan URL gambar publik dan tidak memerlukan login.",
      },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
