import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Parameter UID Free Fire 'id' diperlukan." },
        { status: 400 }
      );
    }

    const apiUrl = `https://api.nexadev.my.id/api/ff?id=${encodeURIComponent(id)}`;

    const response = await axios.get(apiUrl, {
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Fixio/1.0",
        Accept: "application/json, text/plain, */*",
      },
    });

    const data = response.data;
    if (!data) {
      return NextResponse.json(
        { ok: false, message: "Tidak ada respons dari server Free Fire." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("FF Stalker route error:", error?.message);
    const status = error?.response?.status || 502;
    const message =
      error?.response?.data?.message ||
      "Gagal mengambil data Free Fire. Pastikan UID akun valid dan coba lagi.";
    return NextResponse.json(
      { ok: false, message },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
