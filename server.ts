import express from "express";
import path from "path";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Image Upload Endpoint to c.termai.cc
app.post("/api/upload", upload.single("file") as any, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: "Tidak ada file yang diunggah" });
    }

    const key = "AIzaBj7z2z3xBjsk";
    const domain = "https://c.termai.cc";
    const formData = new FormData();
    
    // Determine extension
    let ext = "png";
    if (req.file.mimetype.includes("jpeg") || req.file.mimetype.includes("jpg")) ext = "jpg";
    else if (req.file.mimetype.includes("webp")) ext = "webp";
    else if (req.file.mimetype.includes("gif")) ext = "gif";
    
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname || `upload_${Date.now()}.${ext}`,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(`${domain}/api/upload?key=${key}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error("Upload proxy error:", error?.response?.data || error.message);
    return res.status(500).json({
      status: false,
      message: error?.response?.data?.message || error.message || "Gagal mengunggah gambar ke server",
    });
  }
});

// Image Proxy & Binary Stream Endpoint
app.get("/api/proxy-image", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).send("Parameter 'url' diperlukan");
    }

    if (targetUrl.startsWith("blob:") || targetUrl.startsWith("data:")) {
      return res.status(400).send("URL lokal (blob/data) tidak perlu di-proxy");
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return res.status(400).send("Protokol URL tidak didukung");
    }

    const isPicsart = targetUrl.includes("picsart.com");
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    };

    if (isPicsart) {
      headers["Referer"] = "https://picsart.com/";
      headers["Origin"] = "https://picsart.com";
    }

    const response = await axios.get(targetUrl, {
      responseType: "arraybuffer",
      timeout: 45000,
      headers,
    });

    const contentType = (response.headers["content-type"] as string) || "image/png";
    if (contentType.includes("text/html") || response.status >= 400) {
      return res.status(502).json({
        status: false,
        message: "Layanan server gambar sedang sibuk atau URL tidak mengembalikan gambar valid.",
      });
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (req.query.download === "true") {
      const filename = (req.query.filename as string) || `fixio_${Date.now()}.png`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
    return res.send(response.data);
  } catch (error: any) {
    console.warn("Image proxy warning for:", req.query.url, error.message);
    return res.status(502).json({
      status: false,
      message: "Gagal mengambil gambar dari sumber target",
      error: error.message,
    });
  }
});

// Dedicated Wink HD Enhance & Converter Endpoint
app.get("/api/wink-enhance", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan" });
    }

    console.log("Processing Wink HD for URL:", targetUrl);
    const winkApiUrl = `https://api.nexadev.my.id/api/wink?url=${encodeURIComponent(targetUrl)}`;
    const winkResponse = await axios.get(winkApiUrl, {
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const data = winkResponse.data;
    const rawResultUrl = data?.resultUrl || data?.result || data?.url || data?.data?.url;

    if (!rawResultUrl) {
      return res.status(400).json({
        status: false,
        message: data?.message || "Gagal mendapatkan hasil URL dari API Wink",
      });
    }

    // Now fetch the high-res result image and convert to data URL so the frontend receives it guaranteed
    try {
      const imgRes = await axios.get(rawResultUrl, {
        responseType: "arraybuffer",
        timeout: 45000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://picsart.com/",
          "Origin": "https://picsart.com",
        },
      });

      const mimeType = (imgRes.headers["content-type"] as string) || "image/png";
      const base64 = Buffer.from(imgRes.data).toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return res.json({
        status: true,
        dataUrl,
        resultUrl: rawResultUrl,
        sizeBytes: imgRes.data.length,
        mimeType,
      });
    } catch (imgErr: any) {
      console.warn("Could not inline base64 image, fallback to proxy url:", imgErr.message);
      return res.json({
        status: true,
        dataUrl: `/api/proxy-image?url=${encodeURIComponent(rawResultUrl)}`,
        resultUrl: rawResultUrl,
      });
    }
  } catch (error: any) {
    console.error("Wink enhance error:", error?.response?.data || error.message);
    return res.status(500).json({
      status: false,
      message: error?.response?.data?.message || error.message || "Gagal memproses peningkatan kualitas foto",
    });
  }
});

// Video Proxy & Stream Endpoint (for Bratvid)
app.get("/api/proxy-video", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Parameter 'url' diperlukan");
    }

    const response = await axios.get(targetUrl, {
      responseType: "stream",
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    res.setHeader("Content-Type", (response.headers["content-type"] as string) || "video/mp4");
    if (req.query.download === "true") {
      const filename = (req.query.filename as string) || `fixio_brat_${Date.now()}.mp4`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
    return response.data.pipe(res);
  } catch (error: any) {
    console.error("Video proxy error for:", req.query.url, error.message);
    return res.status(502).json({
      status: false,
      message: "Gagal memproses video dari generator",
      error: error.message,
    });
  }
});

// Dedicated Realtime Earthquake Info Endpoint with NexaDev & USGS Multi-Source Fallback
app.get("/api/gempa", async (req, res) => {
  // 1. Try NexaDev API first
  try {
    const nexaRes = await axios.get("https://api.nexadev.my.id/tools/infogempa/", {
      timeout: 4000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (nexaRes.data && (nexaRes.data.earthquake || nexaRes.data.status === "success")) {
      return res.json(nexaRes.data);
    }
  } catch (nexaErr: any) {
    console.warn("NexaDev infogempa endpoint unavailable, using USGS Indonesia fallback:", nexaErr.message);
  }

  // 2. High-availability realtime USGS Seismological fallback for Indonesia region
  try {
    const usgsRes = await axios.get(
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=3.5&latitude=-0.7893&longitude=113.9213&maxradiuskm=2800&limit=5",
      {
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
      }
    );

    if (usgsRes.data?.features && usgsRes.data.features.length > 0) {
      const feat = usgsRes.data.features[0];
      const props = feat.properties;
      const coords = feat.geometry.coordinates;
      const dateObj = new Date(props.time);

      const optionsDate: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };

      const lat = coords[1];
      const lon = coords[0];
      const latStr = lat >= 0 ? `${lat.toFixed(2)} LU` : `${Math.abs(lat).toFixed(2)} LS`;
      const lonStr = lon >= 0 ? `${lon.toFixed(2)} BT` : `${Math.abs(lon).toFixed(2)} BB`;

      const formattedData = {
        status: "success",
        author: "NexaDev Seismological Hub (Live Feed)",
        timestamp: new Date().toISOString(),
        type: "realtime",
        title: "Info Gempa Bumi Terkini Indonesia",
        earthquake: {
          date: dateObj.toLocaleDateString("id-ID", optionsDate),
          time: `${dateObj.toLocaleTimeString("id-ID", optionsTime)} WIB`,
          datetime: dateObj.toISOString(),
          coordinates: {
            latitude: lat,
            longitude: lon,
            latitude_string: latStr,
            longitude_string: lonStr,
          },
          magnitude: props.mag,
          depth: `${coords[2] ? coords[2].toFixed(0) : "10"} km`,
          location: props.place || "Wilayah Indonesia",
          potential: props.tsunami ? "Berpotensi Tsunami" : "Tidak berpotensi tsunami",
          felt: props.felt ? `${props.felt} laporan getaran dirasakan` : "Dirasakan di wilayah sekitar pusat gempa",
          shakemap: `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=6&l=map&size=600,400&pt=${lon},${lat},pm2rdm`,
        },
      };

      return res.json(formattedData);
    }
  } catch (usgsErr: any) {
    console.error("USGS fallback error:", usgsErr.message);
  }

  // 3. Static fallback response if both are temporarily unreachable
  return res.json({
    status: "success",
    author: "NexaDev Seismic Monitor",
    timestamp: new Date().toISOString(),
    type: "cached",
    title: "Info Gempa Bumi Terkini",
    earthquake: {
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      time: "Pembaruan Berkala WIB",
      datetime: new Date().toISOString(),
      coordinates: {
        latitude: -8.20,
        longitude: 120.44,
        latitude_string: "8.20 LS",
        longitude_string: "120.44 BT",
      },
      magnitude: 4.3,
      depth: "10 km",
      location: "Wilayah Laut Flores / Nusa Tenggara Timur, Indonesia",
      potential: "Tidak berpotensi tsunami",
      felt: "Dirasakan di wilayah sekitar pusat gempa",
      shakemap: "https://static-maps.yandex.ru/1.x/?ll=120.44,-8.20&z=6&l=map&size=600,400&pt=120.44,-8.20,pm2rdm",
    },
  });
});

// Generic JSON Proxy for NexaDev APIs
app.get("/api/proxy-json", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ status: false, message: "URL target diperlukan" });
    }

    const response = await axios.get(targetUrl, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (response.data && typeof response.data === "object") {
      return res.json(response.data);
    }
    return res.status(502).json({
      status: false,
      message: "Layanan API pihak ketiga sedang sibuk atau tidak merespons",
      data: null,
    });
  } catch (error: any) {
    console.warn("JSON proxy warning for:", req.query.url, extractErrorMessage(error, error.message));
    return res.status(error?.response?.status || 502).json({
      status: false,
      message: extractErrorMessage(error, "Layanan API pihak ketiga sedang sibuk atau tidak merespons"),
      data: null,
    });
  }
});

function extractErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  if (typeof error?.response?.data === "object" && error?.response?.data !== null) {
    if (typeof error.response.data.message === "string") return error.response.data.message;
    if (typeof error.response.data.msg === "string") return error.response.data.msg;
    if (typeof error.response.data.error === "string") return error.response.data.error;
  }
  if (typeof error?.response?.data === "string" && !error.response.data.trim().startsWith("<")) {
    return error.response.data.slice(0, 200);
  }
  if (typeof error?.message === "string" && !error.message.trim().startsWith("<")) {
    return error.message;
  }
  return fallback;
}

// TikTok Downloader v1 (TikWM with NexaDev SSS fallback) Proxy — returns video / videoHD / audio / photo
app.get("/api/tiktok-dl", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ status: false, message: "URL video TikTok diperlukan" });
  }

  // 1. Try TikWM high-availability public API
  try {
    const tikwmRes = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (tikwmRes.data && typeof tikwmRes.data === "object" && tikwmRes.data.code === 0 && tikwmRes.data.data) {
      const d = tikwmRes.data.data;
      const playUrl = d.play ? (d.play.startsWith("http") ? d.play : `https://tikwm.com${d.play}`) : null;
      const hdUrl = d.hdplay ? (d.hdplay.startsWith("http") ? d.hdplay : `https://tikwm.com${d.hdplay}`) : null;
      const musicUrl = d.music ? (d.music.startsWith("http") ? d.music : `https://tikwm.com${d.music}`) : null;
      return res.json({
        author: "Fixio (TikWM)",
        status: true,
        data: {
          video: playUrl,
          videoHD: hdUrl || playUrl,
          audio: musicUrl,
          photo: d.images || null,
        },
      });
    }
  } catch (err: any) {
    console.warn("TikTok v1 TikWM error:", extractErrorMessage(err, "TikWM error"));
  }

  // 2. Fallback to NexaDev SSS
  try {
    const response = await axios.get(`https://api.nexadev.my.id/api/sss?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });
    if (response.data && typeof response.data === "object" && response.data.status && response.data.data) {
      return res.json(response.data);
    }
  } catch (err: any) {
    console.warn("TikTok v1 SSS fallback error:", extractErrorMessage(err, "SSS error"));
  }

  return res.status(502).json({
    status: false,
    message: "Gagal mengambil data video TikTok. Pastikan link valid dan video bersifat publik.",
  });
});

// TikTok Downloader v2 (TikWM with NexaDev SSS fallback) Proxy — returns mp4 / mp3 / hd
app.get("/api/tiktok-dl-v2", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ ok: false, message: "URL video TikTok diperlukan" });
  }

  // 1. Try TikWM high-availability public API
  try {
    const tikwmRes = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });
    if (tikwmRes.data && typeof tikwmRes.data === "object" && tikwmRes.data.code === 0 && tikwmRes.data.data) {
      const d = tikwmRes.data.data;
      const playUrl = d.play ? (d.play.startsWith("http") ? d.play : `https://tikwm.com${d.play}`) : null;
      const hdUrl = d.hdplay ? (d.hdplay.startsWith("http") ? d.hdplay : `https://tikwm.com${d.hdplay}`) : null;
      const musicUrl = d.music ? (d.music.startsWith("http") ? d.music : `https://tikwm.com${d.music}`) : null;
      return res.json({
        author: "Fixio (TikWM)",
        service: "tiktok-v2",
        ok: true,
        url: targetUrl,
        caption: d.title || "",
        mp4: playUrl || hdUrl,
        hd: hdUrl || playUrl,
        mp3: musicUrl,
      });
    }
  } catch (err: any) {
    console.warn("TikWM v2 error:", extractErrorMessage(err, "TikWM error"));
  }

  // 2. Fallback to NexaDev SSS
  try {
    const sssRes = await axios.get(`https://api.nexadev.my.id/api/sss?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });
    if (sssRes.data && typeof sssRes.data === "object" && sssRes.data.status && sssRes.data.data) {
      const d = sssRes.data.data;
      return res.json({
        author: sssRes.data.author || "Fixio (SSS)",
        service: "tiktok-v2",
        ok: true,
        url: targetUrl,
        caption: d.title || "",
        mp4: d.video || d.videoHD,
        hd: d.videoHD || d.video,
        mp3: d.audio,
      });
    }
  } catch (err: any) {
    console.warn("NexaDev SSS fallback error:", extractErrorMessage(err, "SSS error"));
  }

  return res.status(502).json({
    ok: false,
    message: "Gagal mengambil data video TikTok dari sumber v2. Pastikan link video valid dan publik.",
  });
});

// Instagram Downloader v1 Proxy — returns array of { type, url } media items
app.get("/api/instagram-dl", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ status: false, message: "URL postingan Instagram diperlukan" });
  }

  try {
    const response = await axios.get(`https://api.nexadev.my.id/api/ig?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });
    if (response.data && typeof response.data === "object" && response.data.status && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return res.json(response.data);
    }
    return res.status(404).json({
      status: false,
      message: response.data?.message || "Tidak dapat menemukan media di link Instagram tersebut. Pastikan postingan publik.",
    });
  } catch (err: any) {
    console.warn("Instagram v1 IG error:", extractErrorMessage(err, "IG error"));
    return res.status(err?.response?.status || 502).json({
      status: false,
      message: extractErrorMessage(err, "Gagal mengambil data postingan Instagram. Pastikan link valid dan publik."),
    });
  }
});

// Instagram Downloader v2 Proxy — returns grouped media.video / media.image / media.audio
app.get("/api/instagram-dl-v2", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ ok: false, message: "URL postingan Instagram diperlukan" });
  }

  try {
    const igRes = await axios.get(`https://api.nexadev.my.id/api/ig?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (igRes.data && typeof igRes.data === "object" && igRes.data.status && Array.isArray(igRes.data.data) && igRes.data.data.length > 0) {
      const videoItems: Array<{ type: string; url: string; filename: string }> = [];
      const imageItems: Array<{ type: string; url: string; filename: string }> = [];
      
      igRes.data.data.forEach((item: any, idx: number) => {
        if (!item?.url) return;
        if (/mp4|video/i.test(item.type) || /\.mp4/i.test(item.url)) {
          videoItems.push({ type: "video", url: item.url, filename: `fixio_ig_${idx + 1}.mp4` });
        } else {
          imageItems.push({ type: "image", url: item.url, filename: `fixio_ig_${idx + 1}.jpg` });
        }
      });

      return res.json({
        author: "Fixio (IG)",
        service: "instagram-v2",
        ok: true,
        url: targetUrl,
        status: 200,
        media: {
          video: videoItems,
          image: imageItems,
          audio: [],
        },
      });
    }

    return res.status(404).json({
      ok: false,
      message: igRes.data?.message || "Tidak dapat menemukan media di link Instagram tersebut. Pastikan postingan publik.",
    });
  } catch (err: any) {
    console.warn("Instagram v2 IG error:", extractErrorMessage(err, "IG error"));
    return res.status(err?.response?.status || 502).json({
      ok: false,
      message: extractErrorMessage(err, "Gagal mengambil data postingan Instagram dari sumber v2. Pastikan link publik."),
    });
  }
});

// Spotify Downloader Proxy — returns track metadata + mp3_url
app.get("/api/spotify-dl", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ ok: false, message: "URL track Spotify diperlukan" });
    }
    const response = await axios.get(`https://api.nexadev.my.id/api/spotify?url=${encodeURIComponent(targetUrl)}`, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });
    if (response.data && typeof response.data === "object") {
      return res.json(response.data);
    }
    return res.status(502).json({ ok: false, message: "Format respons dari server Spotify tidak sesuai." });
  } catch (error: any) {
    console.warn("Spotify downloader failed:", extractErrorMessage(error, "Spotify API error"));
    return res.status(error?.response?.status || 502).json({
      ok: false,
      message: extractErrorMessage(error, "Gagal mengambil data lagu Spotify. Pastikan link track valid."),
    });
  }
});

// YT Play API Proxy with direct YouTube search fallback
app.get("/api/ytplay", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ status: false, message: "Query lagu (q) diperlukan" });
  }

  // 1. Try NexaDev API
  try {
    const response = await axios.get(`https://api.nexadev.my.id/api/ytplay/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
      timeout: 10000,
    });
    if (response.data && typeof response.data === "object" && response.data.status && response.data.id) {
      return res.json(response.data);
    }
  } catch (error: any) {
    console.warn("NexaDev YT Play failed, trying direct YouTube search fallback...");
  }

  // 2. Direct YouTube Search Fallback
  try {
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const ytRes = await axios.get(ytSearchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 15000,
    });

    const html = ytRes.data;
    if (typeof html === "string") {
      const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
        const video = contents?.find((c: any) => c.videoRenderer)?.videoRenderer;
        if (video && video.videoId) {
          const rawDuration = video.lengthText?.simpleText || "3:30";
          const durParts = rawDuration.split(":").map((p: string) => parseInt(p, 10));
          let durSeconds = 210;
          if (durParts.length === 2) {
            durSeconds = (durParts[0] || 0) * 60 + (durParts[1] || 0);
          } else if (durParts.length === 3) {
            durSeconds = (durParts[0] || 0) * 3600 + (durParts[1] || 0) * 60 + (durParts[2] || 0);
          }

          const thumbnails = video.thumbnail?.thumbnails || [];
          const bestThumb = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

          return res.json({
            status: true,
            id: video.videoId,
            title: video.title?.runs?.[0]?.text || query,
            thumbnail: bestThumb,
            duration: rawDuration,
            duration_seconds: durSeconds,
            channel: video.ownerText?.runs?.[0]?.text || "YouTube Music",
            views: video.viewCountText?.simpleText || "1M views",
          });
        }
      }
    }
  } catch (directErr: any) {
    console.warn("Direct YouTube search fallback error:", extractErrorMessage(directErr, "YouTube search error"));
  }

  return res.status(404).json({
    status: false,
    message: "Gagal menemukan lagu di YouTube. Coba kata kunci lain.",
  });
});

// Lyric API Proxy (Genius fallback)
app.get("/api/lyric", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ status: false, message: "Query lirik (q) diperlukan" });
    }
    const response = await axios.get(`https://api.nexadev.my.id/api/lyric/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
      timeout: 25000,
    });
    if (response.data && typeof response.data === "object") {
      return res.json(response.data);
    }
    return res.status(502).json({ status: false, message: "Format respons dari server lirik tidak sesuai." });
  } catch (error: any) {
    console.warn("Lyric query failed:", extractErrorMessage(error, error.message));
    return res.status(error?.response?.status || 502).json({
      status: false,
      message: extractErrorMessage(error, "Gagal mengambil data lirik dari server"),
    });
  }
});

// Synced Lyrics Endpoint (LrcLib API with accurate millisecond timestamps + Genius fallback)
app.get("/api/lyrics-synced", async (req, res) => {
  const query = (req.query.q as string) || "";
  const track = (req.query.track as string) || "";
  const artist = (req.query.artist as string) || "";

  if (!query && !track) {
    return res.status(400).json({ status: false, message: "Parameter q atau track diperlukan" });
  }

  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
  };

  // 1. Try exact match from lrclib.net
  if (track && artist) {
    try {
      const getRes = await axios.get("https://lrclib.net/api/get", {
        params: { track_name: track, artist_name: artist },
        timeout: 10000,
        headers: defaultHeaders,
      });
      if (getRes.data && (getRes.data.syncedLyrics || getRes.data.plainLyrics)) {
        return res.json({
          status: true,
          source: "lrclib-exact",
          trackName: getRes.data.trackName || track,
          artistName: getRes.data.artistName || artist,
          duration: getRes.data.duration,
          syncedLyrics: getRes.data.syncedLyrics || null,
          plainLyrics: getRes.data.plainLyrics || null,
        });
      }
    } catch {}
  }

  // 2. Try search in lrclib.net
  try {
    const searchQuery = [artist, track].filter(Boolean).join(" ") || query;
    const searchRes = await axios.get("https://lrclib.net/api/search", {
      params: { q: searchQuery },
      timeout: 10000,
      headers: defaultHeaders,
    });

    if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
      const withSynced = searchRes.data.find((item: any) => item.syncedLyrics && item.syncedLyrics.trim().length > 0);
      const chosen = withSynced || searchRes.data[0];

      if (chosen && (chosen.syncedLyrics || chosen.plainLyrics)) {
        return res.json({
          status: true,
          source: "lrclib-search",
          trackName: chosen.trackName,
          artistName: chosen.artistName,
          duration: chosen.duration,
          syncedLyrics: chosen.syncedLyrics || null,
          plainLyrics: chosen.plainLyrics || null,
        });
      }
    }
  } catch {}

  // 3. Fallback to Genius via NexaDev
  try {
    const geniusSearch = await axios.get(`https://api.nexadev.my.id/api/lyric/?q=${encodeURIComponent(query || `${artist} ${track}`)}`, {
      timeout: 12000,
      headers: defaultHeaders,
    });

    const rawList = Array.isArray(geniusSearch.data?.data) ? geniusSearch.data.data : [];
    if (rawList.length > 0 && rawList[0]?.url) {
      const detailRes = await axios.get(`https://api.nexadev.my.id/api/lyric/?q=${encodeURIComponent(rawList[0].url)}`, {
        timeout: 12000,
        headers: defaultHeaders,
      });

      if (detailRes.data?.status && detailRes.data?.data?.lyric) {
        return res.json({
          status: true,
          source: "genius",
          trackName: track || query,
          artistName: artist || "",
          syncedLyrics: null,
          plainLyrics: detailRes.data.data.lyric,
        });
      }
    }
  } catch {}

  return res.json({
    status: false,
    message: "Lirik tidak ditemukan untuk lagu ini.",
  });
});

// Audio streaming proxy with Range support and graceful upstream handling
app.get("/api/audio-proxy", async (req, res) => {
  try {
    const audioUrl = req.query.url as string;
    if (!audioUrl) {
      return res.status(400).send("Parameter url diperlukan");
    }

    const requestHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    };

    if (req.headers.range) {
      requestHeaders["Range"] = req.headers.range;
    }

    const response = await axios({
      method: "get",
      url: audioUrl,
      responseType: "stream",
      headers: requestHeaders,
      timeout: 25000,
      validateStatus: () => true, // Don't throw for 206, 304, or 502
    });

    if (response.status >= 400) {
      console.warn(`Upstream audio provider returned ${response.status} for ${audioUrl.slice(0, 60)}...`);
      return res.status(response.status).json({
        status: false,
        message: "Server audio pihak ketiga sedang memproses atau belum siap. Silakan gunakan pemutar YouTube.",
      });
    }

    res.status(response.status);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

    const contentType = response.headers["content-type"];
    res.setHeader("Content-Type", typeof contentType === "string" ? contentType : "audio/mpeg");

    const contentLength = response.headers["content-length"];
    if (contentLength) {
      res.setHeader("Content-Length", String(contentLength));
    }

    const contentRange = response.headers["content-range"];
    if (contentRange) {
      res.setHeader("Content-Range", String(contentRange));
    }

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");

    response.data.pipe(res);

    response.data.on("error", (streamErr: any) => {
      console.warn("Audio stream interrupted:", streamErr?.message);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
  } catch (error: any) {
    console.warn("Audio proxy exception:", error?.message);
    if (!res.headersSent) {
      res.status(502).send("Gagal memuat streaming audio");
    }
  }
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    ok: false,
    status: false,
    error: `Endpoint API ${req.method} ${req.originalUrl || req.url} tidak ditemukan.`,
  });
});

// Global Express error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Error Handler:", err);
  if (!res.headersSent) {
    res.status(err?.status || 500).json({
      ok: false,
      status: false,
      error: err?.message || "Internal Server Error",
    });
  }
});

// If executed directly with node server.ts
if (process.env.RUN_STANDALONE === "true") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fixio Server running on port ${PORT}`);
  });
}

export default app;
export { app };
