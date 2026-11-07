import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { status: false, message: "Tidak ada file yang diunggah" },
        { status: 400 }
      );
    }

    const key = "AIzaBj7z2z3xBjsk";
    const domain = "https://c.termai.cc";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let ext = "png";
    const type = file.type || "";
    if (type.includes("jpeg") || type.includes("jpg")) ext = "jpg";
    else if (type.includes("webp")) ext = "webp";
    else if (type.includes("gif")) ext = "gif";

    const uploadForm = new FormData();
    uploadForm.append("file", buffer, {
      filename: file.name || `upload_${Date.now()}.${ext}`,
      contentType: type || "image/png",
    });

    const response = await axios.post(`${domain}/api/upload?key=${key}`, uploadForm, {
      headers: { ...uploadForm.getHeaders() },
      timeout: 30000,
    });

    return NextResponse.json(response.data);
  } catch (err: any) {
    console.error("Upload route error:", err?.response?.data || err.message);
    return NextResponse.json(
      {
        status: false,
        message: err?.response?.data?.message || err.message || "Gagal mengunggah gambar ke server",
      },
      { status: 500 }
    );
  }
}
