import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json(
      { author: "NexaDev", status: false, ok: false, message: "Parameter URL Spotify diperlukan" },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://api.nexadev.my.id/api/spotify?url=${encodeURIComponent(targetUrl)}`;
    const response = await axios.get(apiUrl, {
      timeout: 35000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    const body = response.data;
    if (body && typeof body === "object") {
      if (body.status === false) {
        return NextResponse.json(
          {
            author: body.author || "NexaDev",
            status: false,
            ok: false,
            message: body.message || "Gagal mengambil data lagu dari Spotify.",
          },
          { status: 400 }
        );
      }

      if (body.data) {
        const d = body.data;
        const track = {
          index: 1,
          name: d.title || "Unknown Track",
          artist: d.artist || "Unknown Artist",
          cover: d.thumbnail || "",
          thumbnail: d.thumbnail || "",
          duration: d.duration || "",
          preview: d.preview || "",
          mp3_url: d.url || "",
          url: d.url || "",
        };

        return NextResponse.json({
          author: body.author || "NexaDev",
          status: true,
          ok: true,
          data: d,
          tracks: [track],
        });
      }

      return NextResponse.json(body);
    }

    return NextResponse.json(
      { author: "NexaDev", status: false, ok: false, message: "Format respons dari server Spotify tidak sesuai." },
      { status: 502 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        author: "NexaDev",
        status: false,
        ok: false,
        message: error?.response?.data?.message || error.message || "Gagal menghubungi server Spotify NexaDev.",
      },
      { status: error?.response?.status || 502 }
    );
  }
}
