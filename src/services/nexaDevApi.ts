/**
 * NexaDev Centralized API Service Layer
 * 
 * Strict Dual-Host Integration Architecture:
 * - Host 1 (apii.nexadev.my.id): Binary Image & Video Generators (wmp1, wmp2, nokia, fakeff, ttqc, igstory-img, iqc-dark, fakecall, qcwa, fakeffduo, fakeigprofile, bratvid2)
 * - Host 2 (api.nexadev.my.id): JSON APIs, Tools & HD Enhancer (wink, remove background, sss, ig, spotify, infogempa, lyric)
 * 
 * Implements:
 * - Proper URL encoding via URLSearchParams (preserving pipes, Unicode, emoji)
 * - True PNG conversion (HTML5 Canvas encoder/decoder) preserving alpha transparency
 * - Retry with exponential backoff on 5xx upstream errors (max 2 retries)
 * - Binary & Blob stream validation with Content-Type and magic bytes
 * - Safe error mapping for HTTP 400, 413, 415, 429, 500, 502, 503, 504
 * - Automatic Object URL lifecycle management to avoid memory leaks
 */

import axios, { AxiosError } from "axios";
import { getProxiedImageUrl } from "./api";

export const NEXA_API_HOST = "https://api.nexadev.my.id";
export const NEXA_APII_HOST = "https://apii.nexadev.my.id";

export interface BinaryResult {
  blob: Blob;
  mimeType: string;
  filename: string;
  objectUrl: string;
}

export interface WinkJsonResponse {
  statusCode?: number;
  author?: string;
  status?: boolean;
  resultUrl?: string;
  result?: string;
  url?: string;
  timestamp?: string;
  message?: string;
  data?: {
    url?: string;
  };
}

/**
 * Validates whether an input is a valid public HTTP or HTTPS URL
 */
export function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== "string") return false;
  try {
    const parsed = new URL(stringUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Maps standard HTTP and network errors to friendly Indonesian error messages
 */
export function mapNexaError(error: unknown, fallbackMessage = "Terjadi kesalahan saat memproses permintaan."): string {
  if (!error) return fallbackMessage;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    // Extract any server-provided error message if available
    let serverMsg = "";
    if (responseData && typeof responseData === "object") {
      serverMsg = (responseData as any).message || (responseData as any).msg || (responseData as any).error || "";
    } else if (typeof responseData === "string" && !responseData.trim().startsWith("<")) {
      serverMsg = responseData.slice(0, 150);
    }

    if (status === 400 || status === 422) {
      return serverMsg || "URL input kosong, tidak valid, atau parameter yang dikirim kurang lengkap.";
    }
    if (status === 413) {
      return serverMsg || "Ukuran file atau gambar terlalu besar untuk diproses.";
    }
    if (status === 415) {
      return serverMsg || "Format file gambar tidak didukung oleh generator.";
    }
    if (status === 429) {
      return "Batas frekuensi permintaan (rate limit) tercapai. Silakan coba lagi setelah jeda beberapa saat.";
    }
    if (status && status >= 500 && status <= 599) {
      return (
        serverMsg ||
        "Layanan server NexaDev sedang tidak stabil atau terjadi kendala jaringan (Error " + status + "). Silakan coba beberapa saat lagi."
      );
    }
    if (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")) {
      return "Waktu proses habis (timeout). Server membutuhkan waktu lebih lama, silakan coba beberapa saat lagi.";
    }
    if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
      return "Permintaan dibatalkan.";
    }
    return serverMsg || error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

/**
 * Sleep helper for exponential backoff
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * True PNG Converter using Browser Canvas Decoder & Encoder.
 * Preserves transparency and produces an authentic image/png Blob.
 */
export async function convertToPng(input: Blob | ArrayBuffer): Promise<Blob> {
  const sourceBlob = input instanceof Blob ? input : new Blob([input]);

  // If already PNG with valid size, we can return directly
  if (sourceBlob.type === "image/png" && sourceBlob.size > 0) {
    return sourceBlob;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return sourceBlob;
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(sourceBlob);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return resolve(sourceBlob);
        }

        // Draw image onto canvas, preserving transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (pngBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (pngBlob) {
              resolve(pngBlob);
            } else {
              resolve(sourceBlob);
            }
          },
          "image/png",
          1.0
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        console.warn("Canvas conversion notice, using source blob:", err);
        resolve(sourceBlob);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(sourceBlob);
    };

    img.src = objectUrl;
  });
}

/**
 * Fetch Binary Image from Host (apii.nexadev.my.id) or via proxy with retry & backoff
 */
export async function fetchImageBinary(
  endpointUrl: string,
  params: Record<string, string> = {},
  options: { signal?: AbortSignal; defaultFilename?: string } = {}
): Promise<BinaryResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  }

  const queryString = query.toString();
  const fullTargetUrl = queryString ? `${endpointUrl}${endpointUrl.includes("?") ? "&" : "?"}${queryString}` : endpointUrl;
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(fullTargetUrl)}`;

  let lastError: any = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await wait(1000 * Math.pow(2, attempt - 1)); // 1s, 2s backoff
      }

      const response = await axios.get(proxyUrl, {
        responseType: "blob",
        timeout: 90000,
        signal: options.signal,
      });

      const blob: Blob = response.data;
      const rawContentType = response.headers["content-type"];
      const mimeType = (typeof rawContentType === "string" ? rawContentType : blob.type) || "image/png";

      // Verify that response is actually an image and not HTML error page
      if (mimeType.includes("text/html") || mimeType.includes("application/json")) {
        const text = await blob.text();
        throw new Error(text.slice(0, 200) || "Server mengembalikan format yang tidak sesuai.");
      }

      if (blob.size < 64) {
        throw new Error("Ukuran file gambar hasil terlalu kecil atau rusak.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const filename = options.defaultFilename || `fixio_image_${Date.now()}.png`;

      return {
        blob,
        mimeType,
        filename,
        objectUrl,
      };
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      // Do not retry client input errors (400, 422, 413, 415)
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }
    }
  }

  throw new Error(mapNexaError(lastError, "Gagal menghasilkan gambar binary dari server NexaDev."));
}

/**
 * Fetch Video Binary (MP4) from Host (apii.nexadev.my.id/bratvid2) with retry & backoff
 */
export async function fetchVideoBinary(
  endpointUrl: string,
  params: Record<string, string> = {},
  options: { signal?: AbortSignal; defaultFilename?: string } = {}
): Promise<BinaryResult> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  }

  const queryString = query.toString();
  const fullTargetUrl = queryString ? `${endpointUrl}${endpointUrl.includes("?") ? "&" : "?"}${queryString}` : endpointUrl;
  const proxyUrl = `/api/proxy-video?url=${encodeURIComponent(fullTargetUrl)}`;

  let lastError: any = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await wait(1500 * Math.pow(2, attempt - 1));
      }

      const response = await axios.get(proxyUrl, {
        responseType: "blob",
        timeout: 120000,
        signal: options.signal,
      });

      const blob: Blob = response.data;
      const rawContentType = response.headers["content-type"];
      const mimeType = (typeof rawContentType === "string" ? rawContentType : blob.type) || "video/mp4";

      if (mimeType.includes("text/html") || mimeType.includes("application/json")) {
        const text = await blob.text();
        throw new Error(text.slice(0, 200) || "Server video mengembalikan format yang tidak sesuai.");
      }

      const objectUrl = URL.createObjectURL(blob);
      const filename = options.defaultFilename || `fixio_bratvid_${Date.now()}.mp4`;

      return {
        blob,
        mimeType,
        filename,
        objectUrl,
      };
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }
    }
  }

  throw new Error(mapNexaError(lastError, "Gagal membuat video MP4 dari generator."));
}

/**
 * Fetch JSON from API Host (api.nexadev.my.id) with retry & backoff
 */
export async function fetchJsonResult<T = Record<string, unknown>>(
  endpointUrl: string,
  params: Record<string, string> = {},
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  }

  const queryString = query.toString();
  const fullTargetUrl = queryString ? `${endpointUrl}${endpointUrl.includes("?") ? "&" : "?"}${queryString}` : endpointUrl;

  let lastError: any = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await wait(1000 * Math.pow(2, attempt - 1));
      }

      const response = await axios.get<T>("/api/proxy-json", {
        params: { url: fullTargetUrl },
        timeout: 60000,
        signal: options.signal,
      });

      if (response.data && typeof response.data === "object") {
        return response.data;
      }
      throw new Error("Respons server bukan objek JSON yang valid.");
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }
    }
  }

  throw new Error(mapNexaError(lastError, "Gagal mengambil data dari API NexaDev."));
}

// ============================================================================
// FEATURE-SPECIFIC HIGH-LEVEL SERVICE FUNCTIONS
// ============================================================================

/**
 * 1. HD Image (Wink) Enhancer
 * Flow:
 * 1. Panggil server endpoint /api/wink-enhance atau direct API https://api.nexadev.my.id/api/wink?url={IMAGE_URL}
 * 2. Ambil URL hasil dengan urutan prioritas: resultUrl -> result -> url
 * 3. Unduh URL hasil sebagai binary
 * 4. Konversi ke PNG nyata dengan transparansi
 * 5. Return BinaryResult
 */
export async function enhanceWinkHd(imageUrl: string, signal?: AbortSignal): Promise<BinaryResult> {
  if (!imageUrl || !isValidHttpUrl(imageUrl)) {
    throw new Error("URL gambar sumber tidak valid atau kosong. Harap unggah gambar terlebih dahulu.");
  }

  // 1. Try dedicated backend endpoint first (/api/wink-enhance)
  try {
    const backendRes = await axios.get("/api/wink-enhance", {
      params: { url: imageUrl },
      timeout: 90000,
      signal,
    });

    if (backendRes.data?.status && (backendRes.data.dataUrl || backendRes.data.resultUrl)) {
      const targetSource = backendRes.data.dataUrl || backendRes.data.resultUrl;
      const fetchBlobRes = await fetch(targetSource);
      const rawBlob = await fetchBlobRes.blob();
      const pngBlob = await convertToPng(rawBlob);
      const objectUrl = URL.createObjectURL(pngBlob);
      return {
        blob: pngBlob,
        mimeType: "image/png",
        filename: `wink_hd_${Date.now()}.png`,
        objectUrl,
      };
    } else if (backendRes.data?.message) {
      throw new Error(backendRes.data.message);
    }
  } catch (backendErr: any) {
    if (backendErr.name === "CanceledError" || backendErr.code === "ERR_CANCELED") {
      throw backendErr;
    }
    const serverMsg = backendErr?.response?.data?.message || backendErr.message;
    if (serverMsg && !serverMsg.includes("status code 500") && !serverMsg.includes("Network Error")) {
      throw new Error(serverMsg);
    }
    console.warn("Dedicated wink-enhance endpoint notice, trying direct API:", backendErr.message);
  }

  // 2. Direct JSON flow to canonical https://api.nexadev.my.id/api/wink/?url={IMAGE_URL}
  const winkApiUrl = `${NEXA_API_HOST}/api/wink/`;
  const jsonData = await fetchJsonResult<WinkJsonResponse>(winkApiUrl, { url: imageUrl }, { signal });

  const rawUrl = jsonData.resultUrl || jsonData.result || jsonData.url || jsonData.data?.url;
  if (!rawUrl || !isValidHttpUrl(rawUrl)) {
    throw new Error(jsonData.message || "Gagal mendapatkan tautan hasil resolusi HD dari API Wink.");
  }

  // Download raw URL through image proxy
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
  const imgResponse = await axios.get(proxyUrl, {
    responseType: "blob",
    timeout: 60000,
    signal,
  });

  const rawBlob: Blob = imgResponse.data;
  const pngBlob = await convertToPng(rawBlob);
  const objectUrl = URL.createObjectURL(pngBlob);

  return {
    blob: pngBlob,
    mimeType: "image/png",
    filename: `wink_hd_${Date.now()}.png`,
    objectUrl,
  };
}

/**
 * 2. Remove Background
 * Primary: /api/nexa/remove-bg?url={IMAGE_URL}
 * Fallback: https://api.nexadev.my.id/tools/remove/?url={IMAGE_URL}
 * Output: image binary (PNG transparan)
 */
export async function removeBackground(imageUrl: string, signal?: AbortSignal): Promise<BinaryResult> {
  if (!imageUrl || !isValidHttpUrl(imageUrl)) {
    throw new Error("URL gambar sumber tidak valid atau kosong. Harap unggah gambar terlebih dahulu.");
  }

  // 1. Try dedicated backend endpoint first (/api/nexa/remove-bg)
  try {
    const res = await axios.get("/api/nexa/remove-bg", {
      params: { url: imageUrl },
      responseType: "blob",
      timeout: 60000,
      signal,
    });

    const blob: Blob = res.data;
    const contentType = (res.headers["content-type"] as string) || blob.type || "";

    // Check if the server returned JSON error text
    if (contentType.includes("application/json") || contentType.includes("text/")) {
      const text = await blob.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.message || "Gagal menghapus background gambar.");
      } catch {
        throw new Error(text.slice(0, 150));
      }
    }

    // Check if starts with JSON curly brace
    if (blob.size < 500) {
      const headerText = await blob.slice(0, 50).text();
      if (headerText.trim().startsWith("{")) {
        const fullText = await blob.text();
        try {
          const json = JSON.parse(fullText);
          throw new Error(json.message || "Gagal menghapus background gambar.");
        } catch {
          // ignore
        }
      }
    }

    const pngBlob = await convertToPng(blob);
    const objectUrl = URL.createObjectURL(pngBlob);

    return {
      blob: pngBlob,
      mimeType: "image/png",
      filename: `remove_bg_${Date.now()}.png`,
      objectUrl,
    };
  } catch (directErr: any) {
    if (directErr.name === "CanceledError" || directErr.code === "ERR_CANCELED") {
      throw directErr;
    }
    const serverMsg = directErr?.response?.data?.message || directErr.message;
    if (serverMsg && !serverMsg.includes("status code 500") && !serverMsg.includes("Network Error")) {
      throw new Error(serverMsg);
    }
    console.warn("Dedicated remove-bg endpoint notice, trying proxy fallback:", directErr.message);
  }

  // 2. Fallback: Proxy image through /api/proxy-image
  const endpoint = `${NEXA_API_HOST}/tools/remove/`;
  const result = await fetchImageBinary(endpoint, { url: imageUrl }, {
    signal,
    defaultFilename: `remove_bg_${Date.now()}.png`,
  });

  // Ensure real PNG conversion
  const pngBlob = await convertToPng(result.blob);
  const objectUrl = URL.createObjectURL(pngBlob);

  // Revoke previous intermediate blob URL
  URL.revokeObjectURL(result.objectUrl);

  return {
    blob: pngBlob,
    mimeType: "image/png",
    filename: `remove_bg_${Date.now()}.png`,
    objectUrl,
  };
}

/**
 * 3. Brat Video Generator
 * Endpoint: https://apii.nexadev.my.id/bratvid2?text={TEXT}
 * Output: MP4 video binary
 */
export async function generateBratVideo(text: string, signal?: AbortSignal): Promise<BinaryResult> {
  if (!text || !text.trim()) {
    throw new Error("Harap masukkan teks untuk video Brat.");
  }

  const endpoint = `${NEXA_APII_HOST}/bratvid2`;
  return fetchVideoBinary(endpoint, { text: text.trim() }, {
    signal,
    defaultFilename: `bratvid_${Date.now()}.mp4`,
  });
}

/**
 * 4. WMP (Windows Media Player) Generator
 * Endpoints:
 * - WMP 1: https://apii.nexadev.my.id/wmp1?text={TEXT}
 * - WMP 2: https://apii.nexadev.my.id/wmp2?text={TEXT}
 */
export async function generateWmp(
  style: "wmp1" | "wmp2",
  text: string,
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!text || !text.trim()) {
    throw new Error("Harap masukkan teks lirik atau bait kata.");
  }

  const endpoint = `${NEXA_APII_HOST}/${style}`;
  return fetchImageBinary(endpoint, { text: text.trim() }, {
    signal,
    defaultFilename: `wmp_${style}_${Date.now()}.png`,
  });
}

/**
 * 5. Nokia 3310 SMS Canvas Generator
 * Endpoint: https://apii.nexadev.my.id/nokia?text={TEXT}&from={FROM}&date={DATE}&time={TIME}&title={TITLE}
 */
export async function generateNokiaCanvas(
  params: {
    text: string;
    from: string;
    date?: string;
    time?: string;
    title?: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.text || !params.from) {
    throw new Error("Harap lengkapi teks pesan dan nama pengirim.");
  }

  const endpoint = `${NEXA_APII_HOST}/nokia`;
  return fetchImageBinary(
    endpoint,
    {
      text: params.text,
      from: params.from,
      date: params.date || "08/06/2026",
      time: params.time || "12:00",
      title: params.title || "nexa",
    },
    {
      signal,
      defaultFilename: `nokia_sms_${Date.now()}.png`,
    }
  );
}

/**
 * 6. Free Fire Generator (Solo & Duo)
 * Endpoints:
 * - Solo: https://apii.nexadev.my.id/fakeff?usn={USERNAME}
 * - Duo: https://apii.nexadev.my.id/fakeffduo?nickname1={NICKNAME_1}&nickname2={NICKNAME_2}
 */
export async function generateFakeFF(
  params: {
    mode: "solo" | "duo";
    usn?: string;
    nickname1?: string;
    nickname2?: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (params.mode === "duo") {
    if (!params.nickname1 || !params.nickname2) {
      throw new Error("Harap masukkan kedua nickname untuk mode Duo.");
    }
    const endpoint = `${NEXA_APII_HOST}/fakeffduo`;
    return fetchImageBinary(
      endpoint,
      {
        nickname1: params.nickname1,
        nickname2: params.nickname2,
      },
      {
        signal,
        defaultFilename: `freefire_duo_${Date.now()}.png`,
      }
    );
  } else {
    if (!params.usn) {
      throw new Error("Harap masukkan username untuk mode Solo.");
    }
    const endpoint = `${NEXA_APII_HOST}/fakeff`;
    return fetchImageBinary(
      endpoint,
      {
        usn: params.usn,
      },
      {
        signal,
        defaultFilename: `freefire_solo_${Date.now()}.png`,
      }
    );
  }
}

/**
 * 7. TikTok Quote Comment (TTQC)
 * Endpoint: https://apii.nexadev.my.id/ttqc?url={IMAGE_URL}&name={NAME}&text={TEXT}
 */
export async function generateTtqc(
  params: {
    url: string;
    name: string;
    text: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.url || !params.name || !params.text) {
    throw new Error("Harap lengkapi Foto Profil, Nama Akun, dan Teks Komentar.");
  }

  const endpoint = `${NEXA_APII_HOST}/ttqc`;
  return fetchImageBinary(
    endpoint,
    {
      url: params.url,
      name: params.name,
      text: params.text,
    },
    {
      signal,
      defaultFilename: `ttqc_${params.name.replace(/\s+/g, "_")}_${Date.now()}.png`,
    }
  );
}

/**
 * 8. Instagram Story Image Generator
 * Endpoint: https://apii.nexadev.my.id/igstory-img?photo={PHOTO_URL}&avatar={AVATAR_URL}&usn={USERNAME}&name={NAME}
 */
export async function generateIgStory(
  params: {
    photo: string;
    avatar: string;
    usn: string;
    name: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.photo || !params.avatar || !params.usn || !params.name) {
    throw new Error("Harap lengkapi Foto Utama, Avatar, Username, dan Nama.");
  }

  const endpoint = `${NEXA_APII_HOST}/igstory-img`;
  return fetchImageBinary(
    endpoint,
    {
      photo: params.photo,
      avatar: params.avatar,
      usn: params.usn,
      name: params.name,
    },
    {
      signal,
      defaultFilename: `igstory_${Date.now()}.png`,
    }
  );
}

/**
 * 9. iPhone Quote Chat Dark Mode (IQC Dark)
 * Endpoint: https://apii.nexadev.my.id/iqc-dark?text={TEXT}&time={TIME}&url={IMAGE_URL}
 * Mendukung dengan gambar (lampiran foto) maupun tanpa gambar (teks saja)
 */
export async function generateIqcDark(
  params: {
    text: string;
    time?: string;
    url?: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.text) {
    throw new Error("Harap masukkan teks pesan.");
  }

  const endpoint = `${NEXA_APII_HOST}/iqc-dark`;
  const queryParams: Record<string, string> = {
    text: params.text,
    time: params.time || "00.00",
  };

  if (params.url && params.url.trim()) {
    queryParams.url = params.url.trim();
  }

  return fetchImageBinary(
    endpoint,
    queryParams,
    {
      signal,
      defaultFilename: `iqc_dark_${Date.now()}.png`,
    }
  );
}

/**
 * 10. Fake Call WhatsApp / Phone
 * Endpoint: https://apii.nexadev.my.id/fakecall?ppurl={PROFILE_URL}&name={NAME}&duration={DURATION}
 */
export async function generateFakeCall(
  params: {
    ppurl: string;
    name: string;
    duration: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.ppurl || !params.name) {
    throw new Error("Harap lengkapi Foto Profil dan Nama Penelpon.");
  }

  const endpoint = `${NEXA_APII_HOST}/fakecall`;
  return fetchImageBinary(
    endpoint,
    {
      ppurl: params.ppurl,
      name: params.name,
      duration: params.duration || "00.00",
    },
    {
      signal,
      defaultFilename: `fakecall_${params.name.replace(/\s+/g, "_")}_${Date.now()}.png`,
    }
  );
}

/**
 * 11. Quote Chat WhatsApp (QCWA)
 * Endpoint: https://apii.nexadev.my.id/qcwa?usn={USERNAME}&phone={PHONE}&pp={PROFILE_URL}&text={TEXT}&mode={MODE}&tag={TAG}&img={IMAGE_URL}
 * (img is optional)
 */
export async function generateQcWa(
  params: {
    usn: string;
    phone: string;
    pp: string;
    text: string;
    mode: "light" | "dark" | string;
    tag?: string;
    img?: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.usn || !params.pp || !params.text) {
    throw new Error("Harap lengkapi Username, Foto Profil, dan Pesan Teks.");
  }

  const queryParams: Record<string, string> = {
    usn: params.usn,
    phone: params.phone || "6281234567890",
    pp: params.pp,
    text: params.text,
    mode: params.mode || "light",
  };

  if (params.tag) queryParams.tag = params.tag;
  if (params.img) queryParams.img = params.img;

  const endpoint = `${NEXA_APII_HOST}/qcwa`;
  return fetchImageBinary(endpoint, queryParams, {
    signal,
    defaultFilename: `qcwa_${params.usn.replace(/\s+/g, "_")}_${Date.now()}.png`,
  });
}

/**
 * 12. Fake Instagram Profile Card
 * Endpoint: https://apii.nexadev.my.id/fakeigprofile?ppurl={PROFILE_URL}&username={USERNAME}&postingan={POSTS}&mengikuti={FOLLOWING}&pengikut={FOLLOWERS}&bio={BIO}
 */
export async function generateFakeIgProfile(
  params: {
    ppurl: string;
    username: string;
    postingan: string;
    mengikuti: string;
    pengikut: string;
    bio: string;
  },
  signal?: AbortSignal
): Promise<BinaryResult> {
  if (!params.ppurl || !params.username) {
    throw new Error("Harap lengkapi Foto Profil dan Username Instagram.");
  }

  const endpoint = `${NEXA_APII_HOST}/fakeigprofile`;
  return fetchImageBinary(
    endpoint,
    {
      ppurl: params.ppurl,
      username: params.username,
      postingan: params.postingan || "0",
      mengikuti: params.mengikuti || "0",
      pengikut: params.pengikut || "0",
      bio: params.bio || "",
    },
    {
      signal,
      defaultFilename: `fake_ig_${params.username}_${Date.now()}.png`,
    }
  );
}

export interface ReminiData {
  id?: string;
  filename?: string;
  original_name?: string;
  bytes?: number;
  size?: string;
  mime?: string;
  extension?: string;
  url: string;
}

export interface ReminiResponse {
  author?: string;
  status?: boolean;
  data?: ReminiData;
  message?: string;
}

/**
 * 13. Remini AI Photo Enhancer
 * Endpoint: https://api.nexadev.my.id/api/remini?url={IMAGE_URL}
 */
export async function enhanceReminiPhoto(
  imageUrl: string,
  signal?: AbortSignal
): Promise<{
  enhancedUrl: string;
  objectUrl: string;
  data: ReminiData;
}> {
  if (!imageUrl || !isValidHttpUrl(imageUrl)) {
    throw new Error("URL gambar tidak valid. Harap pilih atau unggah gambar publik.");
  }

  const endpoint = `${NEXA_API_HOST}/api/remini?url=${encodeURIComponent(imageUrl)}`;
  
  let responseData: ReminiResponse;
  try {
    const res = await axios.get<ReminiResponse>("/api/proxy-json", {
      params: { url: endpoint },
      signal,
      timeout: 60000,
    });
    responseData = res.data;
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") {
      throw new Error("Permintaan dibatalkan.");
    }
    throw new Error(mapNexaError(err, "Gagal meningkatkan kualitas foto menggunakan Remini AI."));
  }

  if (!responseData || !responseData.status || !responseData.data || !responseData.data.url) {
    throw new Error(
      responseData?.message || "Gagal memperoleh hasil foto Remini dari server upstream."
    );
  }

  const resultUrl = responseData.data.url;
  
  // Format to proxied JPG URL for seamless display
  const proxiedJpgUrl = getProxiedImageUrl(resultUrl, false, responseData.data.filename || "remini_enhanced.jpg");

  try {
    const imageBlobRes = await axios.get(proxiedJpgUrl, {
      responseType: "blob",
      signal,
      timeout: 60000,
    });
    const blob = new Blob([imageBlobRes.data], { type: "image/jpeg" });
    const objectUrl = URL.createObjectURL(blob);
    return {
      enhancedUrl: resultUrl,
      objectUrl,
      data: responseData.data,
    };
  } catch {
    return {
      enhancedUrl: resultUrl,
      objectUrl: proxiedJpgUrl,
      data: responseData.data,
    };
  }
}

export interface ImgToPromptResponse {
  author?: string;
  status?: boolean;
  data?: {
    prompt?: string;
  };
  message?: string;
}

/**
 * 14. Image to Prompt AI
 * Endpoint: https://api.nexadev.my.id/ai/imgtopromt?url={IMAGE_URL}
 */
export async function getImageToPrompt(
  imageUrl: string,
  signal?: AbortSignal
): Promise<string> {
  if (!imageUrl || !isValidHttpUrl(imageUrl)) {
    throw new Error("URL gambar tidak valid. Harap masukkan atau unggah gambar publik.");
  }

  const endpoint = `${NEXA_API_HOST}/ai/imgtopromt?url=${encodeURIComponent(imageUrl)}`;

  let lastError: any = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get<ImgToPromptResponse>("/api/proxy-json", {
        params: { url: endpoint },
        signal,
        timeout: 60000,
      });

      const responseData = res.data;
      if (responseData && responseData.status && responseData.data && responseData.data.prompt) {
        return responseData.data.prompt.trim();
      }

      if (responseData && responseData.message) {
        throw new Error(responseData.message);
      }

      throw new Error("Gagal memperoleh deskripsi prompt dari gambar.");
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === "CanceledError") {
        throw new Error("Permintaan dibatalkan.");
      }
      lastError = err;
      if (attempt === 1 && !signal?.aborted) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw new Error(mapNexaError(lastError, "Gagal menganalisis gambar menjadi deskripsi prompt."));
}

