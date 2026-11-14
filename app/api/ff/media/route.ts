import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import path from "path";

export const dynamic = "force-dynamic";

const FF_UPSTREAM_HOST = ["adenpedia", "my", "id"].join(".");
const FF_UPSTREAM_ORIGIN = `https://${FF_UPSTREAM_HOST}`;

export async function GET(req: NextRequest) {
  try {
    const rawPath = req.nextUrl.searchParams.get("p") || "";
    const cleanPath = rawPath.replace(/^\/+/, "").trim();
    if (!cleanPath || cleanPath.includes("..") || !/^[a-zA-Z0-9/_\-.]+$/.test(cleanPath)) {
      return NextResponse.json({ ok: false, message: "Path aset tidak valid." }, { status: 400 });
    }

    const upstreamUrl = `${FF_UPSTREAM_ORIGIN}/${cleanPath}`;
    const response = await axios.get(upstreamUrl, {
      responseType: "arraybuffer",
      timeout: 25000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
      },
    });

    let contentType = (response.headers["content-type"] as string) || "image/png";
    if (contentType.includes("text/html") || contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, message: "Aset gambar tidak tersedia di server." },
        { status: 404 }
      );
    }
    if (contentType.includes("octet-stream")) {
      contentType =
        cleanPath.toLowerCase().endsWith(".jpg") || cleanPath.toLowerCase().endsWith(".jpeg")
          ? "image/jpeg"
          : "image/png";
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=86400");

    if (req.nextUrl.searchParams.get("download") === "true") {
      const requestedFilename = req.nextUrl.searchParams.get("filename");
      const safeName = (
        requestedFilename ||
        path.basename(cleanPath) ||
        `ff_asset_${Date.now()}.png`
      ).replace(/[^a-zA-Z0-9._-]/g, "_");
      headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
    }

    return new NextResponse(Buffer.from(response.data), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) {
      return NextResponse.json(
        { ok: false, message: "Aset gambar tidak ditemukan (404)." },
        { status: 404 }
      );
    }
    console.warn("FF media Next route error:", error?.message);
    return NextResponse.json(
      { ok: false, message: "Gagal memuat aset gambar Free Fire." },
      { status: status && status >= 400 && status < 600 ? status : 502 }
    );
  }
}
