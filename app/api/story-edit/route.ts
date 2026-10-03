import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import {
  createStoryEdit,
  parseCommand,
  ensureFonts,
} from "../../../src/services/rsStoryEditEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max duration for video rendering

export async function GET() {
  return NextResponse.json({
    ok: true,
    presets: [
      {
        id: "nature",
        label: "Nature's Whisper",
        rawText: "Nature's whisper | Healing, Serenity, Escapism",
        title: "Nature's whisper",
        tags: ["Healing", "Serenity", "Escapism"],
        author: "nexadev",
        sampleVideo: "/samples/nature.mp4",
      },
      {
        id: "sunset",
        label: "The Sunset Vibes",
        rawText: "The sunset vibes | Healing, Vitaminsea, Addict",
        title: "The sunset vibes",
        tags: ["Healing", "Vitaminsea", "Addict"],
        author: "nexadev",
        sampleVideo: "/samples/sunset.mp4",
      },
      {
        id: "twilight",
        label: "Urban Twilight",
        rawText: "Urban twilight | Cityscape, Nightlife, Cinematic",
        title: "Urban twilight",
        tags: ["Cityscape", "Nightlife", "Cinematic"],
        author: "nexadev",
        sampleVideo: "/samples/sunset.mp4",
      },
      {
        id: "morning",
        label: "Morning Coffee",
        rawText: "Morning coffee | Mindful, Productivity, Peace",
        title: "Morning coffee",
        tags: ["Mindful", "Productivity", "Peace"],
        author: "nexadev",
        sampleVideo: "/samples/nature.mp4",
      },
    ],
    sampleVideos: [
      { id: "nature", title: "Emerald Nature Flow", url: "/samples/nature.mp4" },
      { id: "sunset", title: "Warm Sunset Glow", url: "/samples/sunset.mp4" },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    await ensureFonts();

    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | undefined;
    let videoUrl = "";
    let rawText = "Nature's whisper | Healing, Serenity, Escapism";
    let customTitle = "";
    let customTags: string[] | undefined;
    let author = "nexadev";
    let width = 540; // Default 540 for fast generation, 720 for full HD
    let duration = 8;
    let fps = 25;
    let scriptFirstWord = true;

    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch (err: any) {
        console.error("Gagal membaca formData:", err);
        return NextResponse.json(
          {
            ok: false,
            message: "Gagal memproses unggahan file video. File mungkin terlalu besar atau koneksi terputus.",
          },
          { status: 400 }
        );
      }
      const file = formData.get("file") as File | null;
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const arr = await file.arrayBuffer();
        if (arr.byteLength > 0) {
          fileBuffer = Buffer.from(arr);
        }
      }

      videoUrl = (formData.get("url") as string) || "";
      rawText = (formData.get("rawText") as string) || rawText;
      customTitle = (formData.get("title") as string) || "";
      const tagsStr = (formData.get("tags") as string) || "";
      if (tagsStr) {
        try {
          customTags = JSON.parse(tagsStr);
        } catch {
          customTags = tagsStr.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      author = (formData.get("author") as string) || author;
      if (formData.get("width")) width = parseInt(formData.get("width") as string, 10) || 540;
      if (formData.get("duration")) duration = parseInt(formData.get("duration") as string, 10) || 8;
      if (formData.get("fps")) fps = parseInt(formData.get("fps") as string, 10) || 25;
      if (formData.get("scriptFirstWord") !== null) {
        scriptFirstWord = formData.get("scriptFirstWord") !== "false";
      }
    } else {
      const body = await req.json().catch(() => ({}));
      videoUrl = body.url || "";
      rawText = body.rawText || rawText;
      customTitle = body.title || "";
      customTags = body.tags;
      author = body.author || author;
      if (body.width) width = parseInt(body.width, 10) || 540;
      if (body.duration) duration = parseInt(body.duration, 10) || 8;
      if (body.fps) fps = parseInt(body.fps, 10) || 25;
      if (body.scriptFirstWord !== undefined) {
        scriptFirstWord = Boolean(body.scriptFirstWord);
      }
    }

    // Parse title & tags from rawText if not explicitly overridden
    const parsed = parseCommand(rawText);
    const finalTitle = customTitle || parsed.title || "Nature's whisper";
    const finalTags = customTags && customTags.length > 0 ? customTags : parsed.tags;

    // Default sample if neither file nor url given
    if (!fileBuffer && !videoUrl) {
      videoUrl = "/samples/nature.mp4";
    }

    const timestamp = Date.now();
    const safeTitle = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
    const filename = `storyedit_${safeTitle}_${timestamp}.mp4`;
    const outputPath = path.join(process.cwd(), "public", "generated", filename);

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Render using engine
    await createStoryEdit({
      url: videoUrl || undefined,
      fileBuffer,
      title: finalTitle,
      tags: finalTags,
      author,
      width,
      fps,
      duration,
      scriptFirstWord,
      output: outputPath,
    });

    const publicUrl = `/generated/${filename}`;

    return NextResponse.json({
      ok: true,
      videoUrl: publicUrl,
      filename,
      title: finalTitle,
      tags: finalTags,
      author,
      duration,
      width,
      fps,
    });
  } catch (error: any) {
    console.error("Story edit render failed:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Gagal merender video Story Edit Typography.",
      },
      { status: 500 }
    );
  }
}
