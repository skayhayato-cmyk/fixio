import axios from "axios";
import { UploadResult } from "../types";

/**
 * Upload an image File object directly to our server proxy
 * which forwards to https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk
 */
export async function uploadImageFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post<UploadResult>("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Upload failed:", error);
    return {
      status: false,
      message: error?.response?.data?.message || error.message || "Gagal mengunggah gambar",
    };
  }
}

/**
 * Get proxied image URL to bypass CORS and prevent hotlinking blocks.
 * If target is already a blob:, data:, or /api/ URL, returns it directly.
 */
export function getProxiedImageUrl(targetUrl: string, download = false, filename?: string): string {
  if (!targetUrl) return "";
  if (
    targetUrl.startsWith("blob:") ||
    targetUrl.startsWith("data:") ||
    targetUrl.startsWith("/api/")
  ) {
    return targetUrl;
  }
  const params = new URLSearchParams();
  params.append("url", targetUrl);
  if (download) params.append("download", "true");
  if (filename) params.append("filename", filename);
  return `/api/proxy-image?${params.toString()}`;
}

/**
 * Get proxied video URL.
 * If target is already a blob:, data:, or /api/ URL, returns it directly.
 */
export function getProxiedVideoUrl(targetUrl: string, download = false, filename?: string): string {
  if (!targetUrl) return "";
  if (
    targetUrl.startsWith("blob:") ||
    targetUrl.startsWith("data:") ||
    targetUrl.startsWith("/api/")
  ) {
    return targetUrl;
  }
  const params = new URLSearchParams();
  params.append("url", targetUrl);
  if (download) params.append("download", "true");
  if (filename) params.append("filename", filename);
  return `/api/proxy-video?${params.toString()}`;
}

/**
 * Fetch JSON via proxy
 */
export async function fetchProxiedJson<T = any>(targetUrl: string): Promise<T> {
  const response = await axios.get<T>("/api/proxy-json", {
    params: { url: targetUrl },
  });
  return response.data;
}

/**
 * Download an image blob or url directly to user's device
 */
export async function triggerDownload(url: string, filename: string) {
  if (!url) return;
  try {
    // If it's already a blob url or data url, download directly without proxying
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    const isAudio =
      filename.toLowerCase().endsWith(".mp3") ||
      filename.toLowerCase().endsWith(".m4a") ||
      url.includes("spotidown") ||
      url.includes("audio");
    const isVideo = filename.toLowerCase().endsWith(".mp4") || url.includes(".mp4");

    let downloadUrl = url;
    if (isExternal) {
      if (isAudio) {
        downloadUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}&download=true&filename=${encodeURIComponent(filename)}`;
      } else if (isVideo) {
        downloadUrl = getProxiedVideoUrl(url, true, filename);
      } else {
        downloadUrl = getProxiedImageUrl(url, true, filename);
      }
    }

    const res = await fetch(downloadUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    console.error("Download error:", err);
    // Fallback: direct anchor
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Download video specifically
 */
export async function triggerVideoDownload(url: string, filename: string) {
  if (!url) return;
  try {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    const downloadUrl = isExternal ? getProxiedVideoUrl(url, true, filename) : url;

    const res = await fetch(downloadUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    console.error("Video download error:", err);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Universal media downloader for video, audio, or images
 */
export async function downloadMedia(url: string, filename: string, mimeType?: string) {
  if (!url) return;
  try {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    const isAudio =
      mimeType?.includes("audio") ||
      filename.toLowerCase().endsWith(".mp3") ||
      filename.toLowerCase().endsWith(".m4a") ||
      url.includes("spotidown");
    const isVideo =
      mimeType?.includes("video") ||
      url.includes(".mp4") ||
      filename.toLowerCase().endsWith(".mp4");

    let downloadUrl = url;
    if (isExternal) {
      if (isAudio) {
        downloadUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}&download=true&filename=${encodeURIComponent(filename)}`;
      } else if (isVideo) {
        downloadUrl = getProxiedVideoUrl(url, true, filename);
      } else {
        downloadUrl = getProxiedImageUrl(url, true, filename);
      }
    }

    const res = await fetch(downloadUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    console.error("Media download error:", err);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
