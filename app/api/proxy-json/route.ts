import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json(
      { status: false, message: "URL target diperlukan" },
      { status: 200 }
    );
  }

  try {
    const response = await axios.get(targetUrl, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
      validateStatus: () => true,
    });

    if (response.data && typeof response.data === "object") {
      return NextResponse.json(response.data, { status: 200 });
    }

    return NextResponse.json(
      {
        status: false,
        message: "Format respons dari server tidak sesuai.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: false,
        message: error?.message || "Gagal menghubungi server target.",
      },
      { status: 200 }
    );
  }
}
