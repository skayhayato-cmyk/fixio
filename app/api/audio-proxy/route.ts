import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const audioUrl = searchParams.get("url")?.trim();
  const download = searchParams.get("download") === "true";
  const filename = searchParams.get("filename") || "track.mp3";

  if (!audioUrl) {
    return new NextResponse("Parameter url diperlukan", { status: 400 });
  }

  const range = request.headers.get("range");
  const requestHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "*/*",
  };

  if (range) {
    requestHeaders["Range"] = range;
  }

  try {
    const upstream = await axios({
      method: "get",
      url: audioUrl,
      responseType: "arraybuffer",
      headers: requestHeaders,
      timeout: 30000,
      validateStatus: () => true,
    });

    if (upstream.status >= 400) {
      return new NextResponse("Gagal mengambil audio dari upstream", {
        status: upstream.status,
      });
    }

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=3600");

    const contentType = String(upstream.headers["content-type"] || "audio/mpeg");
    headers.set("Content-Type", contentType);

    const contentLength = upstream.headers["content-length"];
    if (contentLength) {
      headers.set("Content-Length", String(contentLength));
    }

    const contentRange = upstream.headers["content-range"];
    if (contentRange) {
      headers.set("Content-Range", String(contentRange));
    }

    if (download || filename) {
      const safeName = filename.replace(/["\r\n]/g, "_");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(safeName)}"`
      );
    }

    return new NextResponse(upstream.data, {
      status: upstream.status,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(error?.message || "Kesalahan streaming audio", {
      status: 502,
    });
  }
}
