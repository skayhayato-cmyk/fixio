import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json(
      { ok: false, error: "Parameter URL TikTok diperlukan" },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://api.nexadev.my.id/api/ampreset?url=${encodeURIComponent(targetUrl)}`;
    const response = await axios.get(apiUrl, {
      timeout: 35000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.tiktok.com/",
      },
      validateStatus: () => true,
    });

    if (response.data && typeof response.data === "object") {
      return NextResponse.json(response.data, { status: 200 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Format respons dari server tidak sesuai atau preset tidak ditemukan.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Gagal menghubungi layanan Alight Motion Preset.",
      },
      { status: 200 }
    );
  }
}
