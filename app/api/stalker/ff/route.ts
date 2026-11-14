import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const FF_UPSTREAM_HOST = ["adenpedia", "my", "id"].join(".");
const FF_HOST_REGEX = new RegExp(
  `https?:\\/\\/(?:www\\.)?${FF_UPSTREAM_HOST.replace(/\./g, "\\.")}\\/([^\\s"'<>]+)`,
  "gi"
);
const FF_TEXT_HOST_REGEX = new RegExp(
  `(?:www\\.)?${FF_UPSTREAM_HOST.replace(/\./g, "\\.")}`,
  "gi"
);

function sanitizeFFPayload<T>(input: T): T {
  if (typeof input === "string") {
    const out = input
      .replace(FF_HOST_REGEX, (_match, relPath: string) => `/api/ff/media?p=${encodeURIComponent(relPath)}`)
      .replace(/NOTIF\s+ADENPEDIA\s+CEK\s+FF/gi, "NOTIF FIXIO CEK FF")
      .replace(/ADENPEDIA/gi, "FIXIO")
      .replace(FF_TEXT_HOST_REGEX, "api.nexadev.my.id");
    return out as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeFFPayload(item)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input as Record<string, any>)) {
      out[k] = sanitizeFFPayload(v);
    }
    return out as T;
  }
  return input;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    let response: any = null;
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await delay(800 * attempt);
        response = await axios.get(apiUrl, {
          timeout: 25000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Fixio/1.0",
            Accept: "application/json, text/plain, */*",
          },
        });
        if (response?.data) break;
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) break;
      }
    }

    const data = response?.data;
    if (!data) {
      throw lastError || new Error("Tidak ada respons dari server Free Fire.");
    }

    const sanitizedData = sanitizeFFPayload(data);

    return NextResponse.json(sanitizedData, {
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
