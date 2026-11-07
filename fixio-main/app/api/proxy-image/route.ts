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

    if (targetUrl.startsWith("blob:") || targetUrl.startsWith("data:")) {
      return NextResponse.json(
        { status: false, message: "URL lokal (blob/data) tidak perlu di-proxy" },
        { status: 400 }
      );
    }

    if (!isSafePublicUrl(targetUrl)) {
      return NextResponse.json(
        { status: false, message: "URL target tidak valid atau tidak diizinkan." },
        { status: 400 }
      );
    }

    const isPicsart = targetUrl.includes("picsart.com");
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    };

    if (isPicsart) {
      headers["Referer"] = "https://picsart.com/";
      headers["Origin"] = "https://picsart.com";
    }

    let response: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        if (attempt > 0) await delay(1000 * Math.pow(2, attempt - 1));
        response = await axios.get(targetUrl, {
          responseType: "arraybuffer",
          timeout: 45000,
          headers,
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
              ? "Rate limit server upstream. Silakan coba sebentar lagi."
              : "Layanan server gambar sedang sibuk atau URL tidak dapat diakses secara publik.",
        },
        { status: errStatus && errStatus >= 400 && errStatus < 600 ? errStatus : 502 }
      );
    }

    const buffer = Buffer.from(response.data);
    let contentType = (response.headers["content-type"] as string) || "image/png";

    // Detect if content is actually a JSON error response
    if (buffer.length > 0 && buffer[0] === 0x7b /* '{' */) {
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
        // proceed if not JSON
      }
    }

    if (contentType.includes("text/html") || contentType.includes("application/json")) {
      return NextResponse.json(
        { status: false, message: "Server mengembalikan format non-gambar." },
        { status: 502 }
      );
    }

    if (contentType.includes("octet-stream")) {
      contentType = "image/png";
    }

    const respHeaders = new Headers();
    respHeaders.set("Content-Type", contentType);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Cache-Control", "public, max-age=86400");
    if (req.nextUrl.searchParams.get("download") === "true") {
      const filename = req.nextUrl.searchParams.get("filename") || `fixio_${Date.now()}.png`;
      respHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    return new Response(buffer, {
      status: 200,
      headers: respHeaders,
    });
  } catch (error: any) {
    console.error("Proxy image route error:", error?.message);
    return NextResponse.json(
      {
        status: false,
        message: "Gagal mengambil gambar dari sumber target",
        error: error.message,
      },
      { status: 502 }
    );
  }
}
