import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username")?.trim();
    if (!username) {
      return NextResponse.json(
        { status: false, message: "Parameter 'username' Roblox diperlukan." },
        { status: 400 }
      );
    }

    const apiUrl = `https://api.nexadev.my.id/api/roblox?username=${encodeURIComponent(username)}`;

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
        { status: false, message: "Tidak ada respons dari server Roblox." },
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
    console.error("Roblox Stalker route error:", error?.message);
    const status = error?.response?.status || 502;
    const message =
      error?.response?.data?.message ||
      "Gagal mengambil data akun Roblox. Pastikan username tepat dan coba lagi.";
    return NextResponse.json(
      { status: false, message },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
