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

    const removeBgUrl = `https://api.nexadev.my.id/tools/remove/?url=${encodeURIComponent(targetUrl)}`;

    let response: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        if (attempt > 0) await delay(1000 * Math.pow(2, attempt - 1));
        response = await axios.get(removeBgUrl, {
          responseType: "arraybuffer",
          timeout: 45000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "image/*, */*",
          },
        });
        if (response && response.status < 400) break;
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          break;
        }
      }
    }

    if (!response) {
      const errStatus = lastError?.response?.status;
      return NextResponse.json(
        {
          status: false,
          message:
            errStatus === 429
              ? "Batas frekuensi permintaan (rate limit) tercapai. Coba sebentar lagi."
              : "Layanan remove background upstream sedang sibuk atau tidak dapat mengakses foto sumber. Pastikan foto berformat JPG/PNG publik.",
        },
        { status: errStatus && errStatus >= 400 && errStatus < 600 ? errStatus : 502 }
      );
    }

    const buffer = Buffer.from(response.data);

    // Verify buffer is not a JSON error disguised as image/png
    if (buffer.length > 0 && buffer[0] === 0x7b /* '{' in ASCII */) {
      try {
        const text = buffer.toString("utf-8");
        const json = JSON.parse(text);
        if (json && (json.status === false || json.statusCode >= 400)) {
          return NextResponse.json(
            {
              status: false,
              message: json.message || "Gagal memproses gambar pada server upstream.",
            },
            { status: 422 }
          );
        }
      } catch {
        // Not valid JSON, proceed
      }
    }

    // Must be at least 64 bytes for a valid PNG/image
    if (buffer.length < 64) {
      return NextResponse.json(
        { status: false, message: "Hasil gambar terlalu kecil atau tidak valid dari server." },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=86400");
    if (req.nextUrl.searchParams.get("download") === "true") {
      headers.set(
        "Content-Disposition",
        `attachment; filename="remove_bg_${Date.now()}.png"`
      );
    }

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Remove bg route error:", error?.message);
    return NextResponse.json(
      {
        status: false,
        message: "Gagal menghapus latar belakang gambar. Pastikan foto memiliki objek yang jelas.",
      },
      { status: 502 }
    );
  }
}
