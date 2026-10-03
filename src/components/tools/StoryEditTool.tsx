import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  AlertCircle,
  Loader2,
  Film,
  Zap,
  Server,
} from "lucide-react";
import { parseCommand } from "../../services/storyEditTypes";

interface PresetItem {
  id: string;
  label: string;
  rawText: string;
  title: string;
  tags: string[];
  author: string;
  sampleVideo: string;
}

const PRESET_LIST: PresetItem[] = [
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
    id: "nature",
    label: "Nature's Whisper",
    rawText: "Nature's whisper | Healing, Serenity, Escapism",
    title: "Nature's whisper",
    tags: ["Healing", "Serenity", "Escapism"],
    author: "nexadev",
    sampleVideo: "/samples/nature.mp4",
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
];

/* ------------------------------------------------------------------ */
/* HELPER MATH & DRAWING (1:1 DARI SCRIPT REFERENCE)                   */
/* ------------------------------------------------------------------ */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!img) return;
  const iw = (img as any).videoWidth || (img as any).naturalWidth || (img as any).width || 0;
  const ih = (img as any).videoHeight || (img as any).naturalHeight || (img as any).height || 0;
  if (!iw || !ih) return;
  const ir = iw / ih;
  const r = w / h;
  let sw = iw;
  let sh = ih;
  let sx = 0;
  let sy = 0;
  if (ir > r) {
    sw = ih * r;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / r;
    sy = (ih - sh) / 2;
  }
  try {
    ctx.drawImage(img as any, sx, sy, sw, sh, x, y, w, h);
  } catch {}
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

function buildLayout(W: number, H: number) {
  const S = W / 720;
  const F = { x: 30 * S, y: 44 * S, w: W - 60 * S, h: H - 88 * S, cx: W / 2 };
  const Y = (k: number) => F.y + F.h * k;
  return { W, H, S, F, Y };
}

function prepareTitle(ctx: CanvasRenderingContext2D, L: any, title: string, scriptFirstWord: boolean) {
  const { F, S, Y } = L;
  const words = title.trim().split(/\s+/);
  let script = "";
  let main = title.trim().toUpperCase();
  if (scriptFirstWord && words.length >= 2) {
    script = words[0][0].toUpperCase() + words[0].slice(1).toLowerCase();
    main = words.slice(1).join(" ").toUpperCase();
  }

  const SQ = 0.58;
  const maxW = F.w * 0.78;
  const measure = (str: string, fs: number) => {
    ctx.font = `${fs}px "Bebas Neue", Impact, sans-serif`;
    return ctx.measureText(str).width;
  };
  const base = 190 * S;
  let lines = [main];
  let fs = base * Math.min(1, maxW / (measure(main, base) * SQ));
  const ws = main.split(" ");
  if (fs < 105 * S && ws.length >= 2) {
    let best: any = null;
    for (let i = 1; i < ws.length; i++) {
      const a = ws.slice(0, i).join(" ");
      const b = ws.slice(i).join(" ");
      const w = Math.max(measure(a, base), measure(b, base));
      if (!best || w < best.w) best = { lines: [a, b], w };
    }
    lines = best.lines;
    fs = base * Math.min(1, maxW / (best.w * SQ));
  }

  const capH = fs * 0.7;
  const step = fs * 0.84;
  const blockH = capH + (lines.length - 1) * step;
  const top = Y(0.345) - blockH / 2;
  const bottom = top + blockH;
  const natMax = Math.max(...lines.map((l) => measure(l, fs)));
  const left = L.F.cx - (natMax * SQ) / 2;

  let fsS = 0;
  let scriptW = 0;
  if (script) {
    const target = F.w * 0.36;
    ctx.font = `${150 * S}px "Pinyon Script", cursive`;
    const w0 = ctx.measureText(script).width;
    fsS = clamp((150 * S * target) / (w0 || 1), 60 * S, 300 * S);
    ctx.font = `${fsS}px "Pinyon Script", cursive`;
    scriptW = ctx.measureText(script).width;
  }

  return {
    script,
    lines,
    fs,
    fsS,
    scriptW,
    sq: SQ,
    capH,
    step,
    top,
    bottom,
    left,
    scriptBase: top + capH * 0.12,
  };
}

function drawBackdrop(ctx: CanvasRenderingContext2D, L: any) {
  const g = ctx.createLinearGradient(0, 0, 0, L.H);
  g.addColorStop(0, "rgba(0,10,32,0.50)");
  g.addColorStop(0.5, "rgba(0,10,32,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L.W, L.H);
}

function drawFrame(ctx: CanvasRenderingContext2D, L: any, t: number) {
  const { F, S } = L;
  const p = easeOutCubic(seg(t, 0, 0.7));
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  const sc = lerp(1.05, 1, p);
  const cy = F.y + F.h / 2;
  ctx.translate(F.cx, cy);
  ctx.scale(sc, sc);
  ctx.translate(-F.cx, -cy);

  const g = ctx.createLinearGradient(0, F.y, 0, F.y + F.h);
  g.addColorStop(0, "rgba(120,160,230,0.14)");
  g.addColorStop(0.5, "rgba(120,160,230,0.03)");
  g.addColorStop(1, "rgba(0,0,0,0.12)");
  rrect(ctx, F.x, F.y, F.w, F.h, 46 * S);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.shadowColor = "rgba(190,220,255,0.7)";
  ctx.shadowBlur = 16 * S;
  ctx.lineWidth = 3 * S;
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  rrect(ctx, F.x, F.y, F.w, F.h, 46 * S);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1 * S;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  rrect(ctx, F.x + 7 * S, F.y + 7 * S, F.w - 14 * S, F.h - 14 * S, 39 * S);
  ctx.stroke();
  ctx.restore();
}

function drawTabs(ctx: CanvasRenderingContext2D, L: any, t: number, T: any, tags: string[]) {
  const { F, S, Y } = L;
  const p = easeOutCubic(seg(t, T.tabs, T.tabs + 0.7));
  if (p <= 0 || !tags.length) return;
  const active = Math.floor((tags.length - 1) / 2);
  const gap = 56 * S;
  const padX = 28 * S;
  const maxW = F.w * 0.9;

  let fs = 38 * S;
  const slots = (size: number) => {
    ctx.font = `italic ${size}px "Instrument Serif", serif`;
    return tags.map((tg, i) => ctx.measureText(tg).width + (i === active ? padX * 2 : 0));
  };
  let ws = slots(fs);
  let total = ws.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  if (total > maxW) {
    fs *= maxW / total;
    ws = slots(fs);
    total = ws.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  }

  const cy = Y(0.078) + (1 - p) * 10 * S;
  let x = F.cx - total / 2;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic ${fs}px "Instrument Serif", serif`;
  tags.forEach((tg, i) => {
    const w = ws[i];
    if (i === active) {
      const ph = 62 * S;
      rrect(ctx, x, cy - ph / 2, w, ph, ph / 2);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      ctx.lineWidth = 2 * S;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();
    }
    ctx.fillStyle = i === active ? "#fff" : "rgba(255,255,255,0.82)";
    ctx.fillText(tg, x + w / 2, cy);
    x += w + gap;
  });
  ctx.restore();
}

function drawTitle(ctx: CanvasRenderingContext2D, L: any, t: number, T: any, ti: any) {
  const { F, S } = L;
  const p = easeOutCubic(seg(t, T.title, T.title + 0.75));
  if (p > 0) {
    ctx.save();
    ctx.globalAlpha = p;
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 14 * S;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${ti.fs}px "Bebas Neue", Impact, sans-serif`;
    ti.lines.forEach((ln: string, k: number) => {
      ctx.save();
      ctx.translate(F.cx, ti.top + ti.capH + k * ti.step + (1 - p) * 30 * S);
      ctx.scale(ti.sq, 1);
      ctx.fillText(ln, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  if (ti.script) {
    const q = seg(t, T.script, T.script + 0.8);
    if (q > 0) {
      ctx.save();
      ctx.font = `${ti.fsS}px "Pinyon Script", cursive`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.beginPath();
      ctx.rect(ti.left - 40 * S, ti.scriptBase - ti.fsS * 1.2, (ti.scriptW + 80 * S) * easeOutCubic(q), ti.fsS * 1.8);
      ctx.clip();
      ctx.globalAlpha = clamp(q * 2);
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 14 * S;
      ctx.fillStyle = "#fff";
      ctx.fillText(ti.script, ti.left - 8 * S, ti.scriptBase);
      ctx.restore();
    }
  }
}

function drawSub(ctx: CanvasRenderingContext2D, L: any, t: number, T: any, ti: any, author: string) {
  const { S } = L;
  const p = easeOutCubic(seg(t, T.sub, T.sub + 0.6));
  if (p <= 0) return;
  const y = ti.bottom + 38 * S;
  const x = ti.left + 8 * S + (1 - p) * -14 * S;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${23 * S}px "Poppins", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const a = "storytelling by ";
  ctx.fillText(a, x, y);
  const wa = ctx.measureText(a).width;
  ctx.font = `italic ${30 * S}px "Instrument Serif", serif`;
  ctx.fillStyle = "#fff";
  ctx.fillText(author, x + wa, y);
  ctx.restore();
}

function drawSearch(ctx: CanvasRenderingContext2D, L: any, t: number, T: any, query: string) {
  const { F, S, Y } = L;
  const p = easeOutCubic(seg(t, T.search, T.search + 0.6));
  if (p <= 0) return;

  let fs = 27 * S;
  ctx.font = `600 ${fs}px "Poppins", sans-serif`;
  const full = ctx.measureText(query).width;
  const w = clamp(full + 130 * S, F.w * 0.46, F.w * 0.84);
  const h = 64 * S;
  const avail = w - 118 * S;
  if (full > avail) {
    fs *= avail / full;
    ctx.font = `600 ${fs}px "Poppins", sans-serif`;
  }

  ctx.save();
  ctx.globalAlpha = p;
  const sc = lerp(0.92, 1, p);
  ctx.translate(F.cx, Y(0.538));
  ctx.scale(sc, sc);
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fill();
  ctx.lineWidth = 2 * S;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.stroke();

  const ix = -w / 2 + 38 * S;
  ctx.lineWidth = 3 * S;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ix, -2 * S, 9 * S, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ix + 6.5 * S, 4.5 * S);
  ctx.lineTo(ix + 14 * S, 12 * S);
  ctx.stroke();

  const k = seg(t, T.typeStart, T.typeEnd);
  const typed = query.slice(0, Math.floor(k * query.length + 1e-6));
  const tx = ix + 30 * S;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${fs}px "Poppins", sans-serif`;
  ctx.fillText(typed, tx, 1 * S);
  const typing = t >= T.typeStart && t < T.typeEnd + 0.9;
  if (typing && Math.floor(t * 2.6) % 2 === 0) {
    const cxp = tx + ctx.measureText(typed).width + 4 * S;
    ctx.fillRect(cxp, -15 * S, 2.5 * S, 30 * S);
  }
  ctx.restore();
}

/**
 * 5 Mini Floating Cards with exact 5 distinct extracted video snapshots (imgs 0 to 4)
 */
function drawCards(
  ctx: CanvasRenderingContext2D,
  L: any,
  t: number,
  T: any,
  imgs: (HTMLCanvasElement | HTMLImageElement | HTMLVideoElement)[]
) {
  const { F, S, Y } = L;
  const spec = [
    { dx: -0.3, dy: 0.625, w: 0.2, r: -7, img: 0 },
    { dx: 0.3, dy: 0.622, w: 0.2, r: 6, img: 1 },
    { dx: -0.17, dy: 0.683, w: 0.255, r: -4, img: 2 },
    { dx: 0.17, dy: 0.683, w: 0.255, r: 4, img: 3 },
    { dx: 0, dy: 0.728, w: 0.3, r: 0, img: 4 },
  ];
  spec.forEach((c, i) => {
    const a = T.cards + i * 0.12;
    const p = seg(t, a, a + 0.55);
    if (p <= 0) return;
    const e = easeOutCubic(p);
    const w = F.w * c.w;
    const h = w * 0.94;
    const tx = F.cx + F.w * c.dx;
    const ty = Y(c.dy) + (i === 4 ? Math.sin(t * 1.8) * 3 * S : 0);
    const x = lerp(F.cx, tx, e);
    const y = lerp(Y(0.538), ty, e);
    const sc = lerp(0.25, 1, easeOutBack(p));

    ctx.save();
    ctx.globalAlpha = clamp(p * 3);
    ctx.translate(x, y);
    ctx.rotate(((c.r * Math.PI) / 180) * e);
    ctx.scale(sc, sc);
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 18 * S;
    ctx.shadowOffsetY = 6 * S;
    rrect(ctx, -w / 2, -h / 2, w, h, 12 * S);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const bd = 3.5 * S;
    ctx.save();
    rrect(ctx, -w / 2 + bd, -h / 2 + bd, w - bd * 2, h - bd * 2, 9 * S);
    ctx.clip();
    const targetImg = (imgs && imgs[c.img]) || (imgs && imgs[0]);
    if (targetImg) {
      drawCover(ctx, targetImg, -w / 2 + bd, -h / 2 + bd, w - bd * 2, h - bd * 2);
    }
    ctx.restore();
    ctx.restore();
  });
}

function drawMusic(
  ctx: CanvasRenderingContext2D,
  L: any,
  t: number,
  T: any,
  music: { title: string; sub: string },
  thumb?: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement
) {
  const { F, S, Y } = L;
  const p = seg(t, T.music, T.music + 0.65);
  if (p <= 0) return;
  const e = easeOutCubic(p);
  const w = F.w * 0.77;
  const h = 98 * S;
  const cx = F.cx;
  const cy = Y(0.885) + (1 - e) * 60 * S;
  const left = cx - w / 2;

  ctx.save();
  ctx.globalAlpha = e;
  rrect(ctx, left, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = "rgba(12,18,32,0.50)";
  ctx.fill();
  ctx.lineWidth = 2 * S;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.stroke();

  // Mini cover thumbnail
  const as = 62 * S;
  const ax = left + 22 * S;
  const ay = cy - as / 2;
  ctx.save();
  rrect(ctx, ax, ay, as, as, 11 * S);
  ctx.clip();
  if (thumb) {
    drawCover(ctx, thumb, ax, ay, as, as);
  }
  ctx.restore();
  rrect(ctx, ax, ay, as, as, 11 * S);
  ctx.lineWidth = 2 * S;
  ctx.strokeStyle = "#fff";
  ctx.stroke();

  // Ikon next track
  const nx = left + w - 58 * S;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(nx - 11 * S, cy - 14 * S);
  ctx.lineTo(nx + 9 * S, cy);
  ctx.lineTo(nx - 11 * S, cy + 14 * S);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(nx + 11 * S, cy - 14 * S, 4 * S, 28 * S);

  // Teks Judul & Subtitle Musik
  const tx = ax + as + 18 * S;
  const maxW = nx - 30 * S - tx;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${27 * S}px "Poppins", sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.fillText(fitText(ctx, music.title, maxW), tx, cy - 14 * S);
  ctx.font = `${21 * S}px "Poppins", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(fitText(ctx, music.sub, maxW), tx, cy + 18 * S);
  ctx.restore();
}

/**
 * Universal Composite Frame Renderer matching the exact logic of rs-canvas.js
 */
function renderTypographyFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  parsedData: { title: string; tags: string[] },
  author: string,
  scriptFirstWord: boolean,
  bgVideo?: HTMLVideoElement | null,
  thumbs: (HTMLCanvasElement | HTMLImageElement | HTMLVideoElement)[] = []
) {
  const L = buildLayout(W, H);
  ctx.clearRect(0, 0, W, H);

  // 0. Background Video Frame (when rendering offscreen composite)
  if (bgVideo && bgVideo.readyState >= 2) {
    try {
      const vw = bgVideo.videoWidth || W;
      const vh = bgVideo.videoHeight || H;
      const scale = Math.max(W / vw, H / vh);
      const sw = W / scale;
      const sh = H / scale;
      const sx = (vw - sw) / 2;
      const sy = (vh - sh) / 2;
      ctx.drawImage(bgVideo, sx, sy, sw, sh, 0, 0, W, H);
    } catch {}
  }

  const clean = (parsedData.title || "The Sunset Vibes").trim();
  const query = clean.replace(/^(the|a|an)\s+/i, "").toLowerCase();
  const music = { title: author, sub: "suara asli" };
  const ti = prepareTitle(ctx, L, clean, scriptFirstWord);

  const T = { tabs: 0.15, title: 0.55, script: 0.95, sub: 1.5, search: 1.9, typeStart: 2.5, typeEnd: 0, cards: 0, music: 0 };
  T.typeEnd = T.typeStart + Math.max(1.0, query.length * 0.11);
  T.cards = T.typeEnd + 0.3;
  T.music = T.cards + 0.6;

  drawBackdrop(ctx, L);
  drawFrame(ctx, L, t);
  drawTabs(ctx, L, t, T, parsedData.tags);
  drawTitle(ctx, L, t, T, ti);
  drawSub(ctx, L, t, T, ti, author);
  drawSearch(ctx, L, t, T, query);
  
  // 5 Mini floating cards with 5 snapshots
  const effectiveThumbs = thumbs.length === 5 ? thumbs : (bgVideo ? [bgVideo, bgVideo, bgVideo, bgVideo, bgVideo] : []);
  drawCards(ctx, L, t, T, effectiveThumbs);
  drawMusic(ctx, L, t, T, music, effectiveThumbs[0]);
}

export const StoryEditTool: React.FC = () => {
  // Main typography text input
  const [rawText, setRawText] = useState("Nature's whisper | Healing, Serenity, Escapism");
  const [author, setAuthor] = useState("nexadev");

  // Video source state: direct file upload is primary
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [selectedSampleVideo, setSelectedSampleVideo] = useState<string>("/samples/nature.mp4");
  const [useSampleMode, setUseSampleMode] = useState<boolean>(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  // 5 Extracted video snapshots for the 5 cards & music thumbnail
  const [previewThumbs, setPreviewThumbs] = useState<HTMLCanvasElement[]>([]);

  // Render Engine Mode: default is browser for zero server burden & zero "Failed to fetch"
  const [renderEngine, setRenderEngine] = useState<"browser" | "server">("browser");

  // Customization options
  const [width, setWidth] = useState<number>(540); // 540x960 fast or 720x1280 HD
  const [duration, setDuration] = useState<number>(8);
  const [scriptFirstWord, setScriptFirstWord] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Copy feedback state
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedResultUrl, setCopiedResultUrl] = useState<boolean>(false);

  // Rendering state
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStep, setRenderStep] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderedResult, setRenderedResult] = useState<{
    videoUrl: string;
    filename: string;
    title: string;
    tags: string[];
    author: string;
    duration: number;
  } | null>(null);

  // Live Canvas Preview state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewTime, setPreviewTime] = useState<number>(4.2);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Parsed metadata from rawText
  const parsedData = useMemo(() => {
    return parseCommand(rawText);
  }, [rawText]);

  // Current effective video URL for preview
  const currentVideoSrc = useMemo(() => {
    if (!useSampleMode && uploadedVideoUrl) {
      return uploadedVideoUrl;
    }
    if (showUrlInput && customVideoUrl.trim()) {
      return customVideoUrl.trim();
    }
    return selectedSampleVideo;
  }, [useSampleMode, uploadedVideoUrl, showUrlInput, customVideoUrl, selectedSampleVideo]);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (uploadedVideoUrl && uploadedVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);

  /**
   * Extract 5 distinct snapshots at 18%, 34%, 50%, 66%, and 82% of duration
   * matching grabThumbs in rs-canvas.js
   */
  useEffect(() => {
    let isCancelled = false;

    const extractFiveThumbs = async () => {
      try {
        const isNature = currentVideoSrc.includes("nature.mp4");
        const isSunset = currentVideoSrc.includes("sunset.mp4");

        // 1. Instant load for pre-rendered sample snapshots
        if (isNature || isSunset) {
          const prefix = isNature ? "nature" : "sunset";
          const promises = [0, 1, 2, 3, 4].map((i) => {
            return new Promise<HTMLCanvasElement>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                const c = document.createElement("canvas");
                c.width = 480;
                c.height = 480;
                const cCtx = c.getContext("2d");
                if (cCtx) {
                  drawCover(cCtx, img, 0, 0, 480, 480);
                }
                resolve(c);
              };
              img.onerror = () => {
                const c = document.createElement("canvas");
                c.width = 480;
                c.height = 480;
                resolve(c);
              };
              img.src = `/samples/${prefix}_th${i}.jpg`;
            });
          });

          const loadedCanvases = await Promise.all(promises);
          if (!isCancelled && loadedCanvases.length === 5) {
            setPreviewThumbs(loadedCanvases);
            return;
          }
        }

        // 2. Dynamic extraction from uploaded / custom video
        const vid = document.createElement("video");
        vid.crossOrigin = "anonymous";
        vid.src = currentVideoSrc;
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = "auto";

        await new Promise<void>((resolve) => {
          const to = setTimeout(resolve, 3500);
          vid.onloadeddata = () => {
            clearTimeout(to);
            resolve();
          };
          vid.onerror = () => {
            clearTimeout(to);
            resolve();
          };
          vid.load();
        });

        const totalDur = vid.duration && !isNaN(vid.duration) && vid.duration > 0 ? vid.duration : duration || 8;
        const ks = [0.18, 0.34, 0.5, 0.66, 0.82];
        const newThumbs: HTMLCanvasElement[] = [];

        // Pre-create 5 canvases with initial frame
        for (let i = 0; i < 5; i++) {
          const c = document.createElement("canvas");
          c.width = 480;
          c.height = 480;
          const cCtx = c.getContext("2d");
          if (cCtx && vid.videoWidth > 0) {
            drawCover(cCtx, vid, 0, 0, 480, 480);
          }
          newThumbs.push(c);
        }

        // Seek through 5 timestamps to extract distinct snapshots
        for (let i = 0; i < ks.length; i++) {
          if (isCancelled) return;
          vid.currentTime = totalDur * ks[i];
          await new Promise<void>((resolve) => {
            const to = setTimeout(resolve, 400);
            vid.onseeked = () => {
              clearTimeout(to);
              resolve();
            };
          });

          const ctx = newThumbs[i].getContext("2d");
          if (ctx && vid.videoWidth > 0) {
            ctx.clearRect(0, 0, 480, 480);
            drawCover(ctx, vid, 0, 0, 480, 480);
          }
        }

        if (!isCancelled && newThumbs.length === 5) {
          setPreviewThumbs(newThumbs);
        }
      } catch (e) {
        console.warn("Client thumbs extraction skipped:", e);
      }
    };

    extractFiveThumbs();

    return () => {
      isCancelled = true;
    };
  }, [currentVideoSrc, duration]);

  // Handle direct file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
        setRenderError("Pilih file video MP4 yang valid.");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        setRenderError("Ukuran file video terlalu besar (maksimal 200MB).");
        return;
      }
      setUploadedFile(file);
      const objUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(objUrl);
      setUseSampleMode(false);
      setRenderError(null);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.includes("video") && !file.name.toLowerCase().endsWith(".mp4")) {
        setRenderError("Pilih file video MP4 yang valid.");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        setRenderError("Ukuran file video terlalu besar (maksimal 200MB).");
        return;
      }
      setUploadedFile(file);
      const objUrl = URL.createObjectURL(file);
      setUploadedVideoUrl(objUrl);
      setUseSampleMode(false);
      setRenderError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Copy raw typography text
  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {}
  };

  // Copy result URL
  const handleCopyResultUrl = async (url: string) => {
    try {
      const fullUrl = url.startsWith("blob:") ? "Video dimuat langsung di browser Anda" : window.location.origin + url;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedResultUrl(true);
      setTimeout(() => setCopiedResultUrl(false), 2000);
    } catch {}
  };

  // Apply preset
  const handleSelectPreset = (p: PresetItem) => {
    setRawText(p.rawText);
    setAuthor(p.author);
    if (useSampleMode || !uploadedFile) {
      setSelectedSampleVideo(p.sampleVideo);
    }
    setRenderError(null);
  };

  // Draw overlay preview on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 360;
    const H = 640;
    canvas.width = W;
    canvas.height = H;

    // Render preview overlays with the 5 extracted thumbnails (or live video fallback)
    const effectiveThumbs = previewThumbs.length === 5 ? previewThumbs : (videoPreviewRef.current ? [videoPreviewRef.current, videoPreviewRef.current, videoPreviewRef.current, videoPreviewRef.current, videoPreviewRef.current] : []);
    renderTypographyFrame(ctx, W, H, previewTime, parsedData, author, scriptFirstWord, null, effectiveThumbs as any);
  }, [previewTime, parsedData, author, scriptFirstWord, previewThumbs]);

  // Video timeupdate sync
  const handleVideoTimeUpdate = () => {
    if (videoPreviewRef.current) {
      setPreviewTime(videoPreviewRef.current.currentTime);
    }
  };

  const togglePreviewPlay = () => {
    if (!videoPreviewRef.current) return;
    if (isPlayingPreview) {
      videoPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      videoPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  /**
   * Browser Direct Render Engine (Zero Server Load & Anti "Failed to fetch")
   * Directly composites video + typography in browser memory using HTML5 Canvas & MediaRecorder.
   */
  const executeBrowserRender = useCallback(async (): Promise<{
    videoUrl: string;
    filename: string;
    duration: number;
  }> => {
    setRenderStep("Menyiapkan Canvas & Perekam Video...");
    setRenderProgress(10);

    // Wait for web fonts to load
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch {}

    const W = width;
    const H = Math.round(((width * 16) / 9) / 2) * 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) throw new Error("Gagal menginisialisasi Canvas di browser.");

    // Prefer using preview video element or create clean video instance
    let vid: HTMLVideoElement;
    if (videoPreviewRef.current && videoPreviewRef.current.readyState >= 2) {
      vid = videoPreviewRef.current;
    } else {
      vid = document.createElement("video");
      if (currentVideoSrc.startsWith("http://") || currentVideoSrc.startsWith("https://")) {
        vid.crossOrigin = "anonymous";
      }
      vid.src = currentVideoSrc;
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = "auto";

      if (vid.readyState < 2) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 3500);
          vid.onloadeddata = () => { clearTimeout(timer); resolve(); };
          vid.oncanplay = () => { clearTimeout(timer); resolve(); };
          vid.onerror = () => { clearTimeout(timer); resolve(); };
          vid.load();
        });
      }
    }

    // Prepare 5 thumbnail canvases initialized with previewThumbs or video frame
    const recThumbs: HTMLCanvasElement[] = [];
    for (let i = 0; i < 5; i++) {
      const c = document.createElement("canvas");
      c.width = 480;
      c.height = 480;
      const cCtx = c.getContext("2d");
      if (cCtx) {
        if (previewThumbs[i]) {
          cCtx.drawImage(previewThumbs[i], 0, 0);
        } else if (vid && vid.videoWidth > 0) {
          drawCover(cCtx, vid, 0, 0, 480, 480);
        }
      }
      recThumbs.push(c);
    }

    const fps = 30;
    const canvasStream = (offscreen as any).captureStream
      ? (offscreen as any).captureStream(fps)
      : (offscreen as any).mozCaptureStream
      ? (offscreen as any).mozCaptureStream(fps)
      : null;

    if (!canvasStream) {
      throw new Error("Browser Anda tidak mendukung perekaman Canvas Stream.");
    }

    // Capture audio from video if available
    try {
      const vidStream = (vid as any).captureStream ? (vid as any).captureStream() : (vid as any).mozCaptureStream ? (vid as any).mozCaptureStream() : null;
      if (vidStream) {
        const audioTracks = vidStream.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
        }
      }
    } catch (e) {
      console.warn("Audio capture bypassed:", e);
    }

    // Determine optimal supported MIME type
    let mimeType = "video/webm";
    const candidates = [
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        mimeType = c;
        break;
      }
    }

    const chunks: Blob[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });
    } catch {
      try {
        recorder = new MediaRecorder(canvasStream);
      } catch (recInitErr: any) {
        throw new Error(recInitErr?.message || "MediaRecorder tidak didukung.");
      }
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const ext = mimeType.includes("mp4") ? "mp4" : "mp4";
    const safeTitle = (parsedData.title || "story").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
    const outFilename = `storyedit_${safeTitle}_${Date.now()}.${ext}`;

    return new Promise<{ videoUrl: string; filename: string; duration: number }>((resolve, reject) => {
      let animId: number;
      let isDone = false;
      const ks = [0.18, 0.34, 0.50, 0.66, 0.82];
      const snapped = [false, false, false, false, false];

      recorder.onstop = () => {
        try { vid.pause(); } catch {}
        cancelAnimationFrame(animId);
        const finalBlob = new Blob(chunks, { type: mimeType });
        const objUrl = URL.createObjectURL(finalBlob);
        resolve({
          videoUrl: objUrl,
          filename: outFilename,
          duration,
        });
      };

      recorder.onerror = (e: any) => {
        try { vid.pause(); } catch {}
        cancelAnimationFrame(animId);
        reject(new Error(e?.error?.message || "Gagal merekam video di browser."));
      };

      recorder.start(200);
      vid.currentTime = 0;

      const playPromise = vid.play();
      const startLoop = () => {
        const startTime = performance.now();
        const targetDurationMs = duration * 1000;

        const loop = () => {
          if (isDone) return;
          const elapsed = performance.now() - startTime;
          const curSec = Math.min(duration, elapsed / 1000);
          const ratio = curSec / duration;
          const pct = Math.min(98, Math.round((curSec / duration) * 100));

          // Real-time snapshot of live video frames at exact intervals
          for (let k = 0; k < ks.length; k++) {
            if (!snapped[k] && ratio >= ks[k] && vid.videoWidth > 0) {
              snapped[k] = true;
              const sCtx = recThumbs[k].getContext("2d");
              if (sCtx) {
                sCtx.clearRect(0, 0, 480, 480);
                drawCover(sCtx, vid, 0, 0, 480, 480);
              }
            }
          }

          setRenderProgress(pct);
          setRenderStep(`Merender frame tipografi & video (${pct}%)...`);

          renderTypographyFrame(
            offCtx,
            W,
            H,
            curSec,
            parsedData,
            author,
            scriptFirstWord,
            vid,
            recThumbs
          );

          if (elapsed >= targetDurationMs || vid.ended) {
            isDone = true;
            setRenderProgress(100);
            setRenderStep("Menyelesaikan berkas video...");
            recorder.stop();
          } else {
            animId = requestAnimationFrame(loop);
          }
        };

        animId = requestAnimationFrame(loop);
      };

      if (playPromise !== undefined) {
        playPromise.then(startLoop).catch(() => {
          // If autoplay is restricted, continue loop with simulated clock
          startLoop();
        });
      } else {
        startLoop();
      }
    });
  }, [width, currentVideoSrc, duration, parsedData, author, scriptFirstWord, previewThumbs]);

  /**
   * Server Render Engine (FFmpeg Ultra Speed via rawvideo)
   */
  const executeServerRender = async (): Promise<{
    videoUrl: string;
    filename: string;
    duration: number;
  }> => {
    let finalVideoUrl = "";
    let finalFilename = `storyedit_${Date.now()}.mp4`;
    let finalDuration = duration;

    try {
      if (!useSampleMode && uploadedFile) {
        setRenderStep("Mengunggah data video ke server...");
        setRenderProgress(20);

        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("rawText", rawText);
        formData.append("author", author);
        formData.append("width", String(width));
        formData.append("duration", String(duration));
        formData.append("scriptFirstWord", String(scriptFirstWord));

        const res = await axios.post("/api/story-edit", formData, {
          responseType: "blob",
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const uploadPct = Math.round((progressEvent.loaded * 45) / progressEvent.total);
              setRenderProgress(15 + uploadPct);
              if (uploadPct >= 42) {
                setRenderStep("Merender video & tipografi dengan FFmpeg...");
              }
            }
          },
        });

        if (res.data instanceof Blob) {
          finalVideoUrl = URL.createObjectURL(res.data);
          finalFilename = (res.headers["x-video-filename"] as string) || finalFilename;
          finalDuration = Number(res.headers["x-video-duration"]) || duration;
        }
      } else {
        setRenderStep("Memproses render video di server...");
        setRenderProgress(35);
        const targetUrl = showUrlInput && customVideoUrl.trim()
          ? customVideoUrl.trim()
          : selectedSampleVideo;

        const res = await axios.post(
          "/api/story-edit",
          {
            url: targetUrl,
            rawText,
            author,
            width,
            duration,
            scriptFirstWord,
          },
          {
            responseType: "blob",
            timeout: 300000,
          }
        );

        if (res.data instanceof Blob) {
          finalVideoUrl = URL.createObjectURL(res.data);
          finalFilename = (res.headers["x-video-filename"] as string) || finalFilename;
          finalDuration = Number(res.headers["x-video-duration"]) || duration;
        }
      }

      return {
        videoUrl: finalVideoUrl,
        filename: finalFilename,
        duration: finalDuration,
      };
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          throw new Error(json.message || text);
        } catch (subErr: any) {
          if (subErr.message && !subErr.message.includes("JSON")) {
            throw subErr;
          }
        }
      }
      throw err;
    }
  };

  /**
   * Main Render Handler with Intelligent Two-Way Fallback
   */
  const handleStartRender = async () => {
    if (renderedResult?.videoUrl && renderedResult.videoUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(renderedResult.videoUrl);
      } catch {}
    }

    setIsRendering(true);
    setRenderError(null);
    setRenderedResult(null);
    setRenderProgress(10);

    try {
      let resultData: { videoUrl: string; filename: string; duration: number };

      if (renderEngine === "browser") {
        try {
          resultData = await executeBrowserRender();
        } catch (browserErr: any) {
          console.warn("Browser render error, switching to Server Engine:", browserErr);
          setRenderStep("Mengalihkan pemrosesan ke Server FFmpeg...");
          setRenderProgress(25);
          resultData = await executeServerRender();
        }
      } else {
        try {
          resultData = await executeServerRender();
        } catch (serverErr: any) {
          console.warn("Server render error, switching to Browser Engine:", serverErr);
          setRenderStep("Mengalihkan pemrosesan ke Browser Engine...");
          setRenderProgress(20);
          resultData = await executeBrowserRender();
        }
      }

      setRenderProgress(100);
      setRenderStep("Selesai! Video langsung ditampilkan.");
      setRenderedResult({
        videoUrl: resultData.videoUrl,
        filename: resultData.filename,
        title: parsedData.title || "The Sunset Vibes",
        tags: parsedData.tags,
        author,
        duration: resultData.duration,
      });
    } catch (err: any) {
      console.error("Render execution error:", err);
      let errMsg = "Gagal memproses render video Story Edit.";
      if (err?.message === "Network Error" || err?.message?.includes("fetch")) {
        errMsg = "Koneksi terputus. Silakan coba lagi.";
      } else if (err?.message) {
        errMsg = err.message;
      }
      setRenderError(errMsg);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
          <span>Story Edit Typography</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700">
            MP4 9:16
          </span>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">
          Render animasi tipografi aesthetic langsung di atas video MP4. Hasil langsung ditampilkan tanpa menumpuk di server.
        </p>
      </div>

      {/* Main Grid: Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Direct Upload */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Video Source */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                1. Sumber Video MP4
              </span>
              <span className="text-[11px] text-neutral-500 font-medium">Format 9:16 Story</span>
            </div>

            {/* Direct Upload Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                uploadedFile && !useSampleMode
                  ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800/40"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-800/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {uploadedFile && !useSampleMode
                    ? uploadedFile.name
                    : "Pilih atau Seret Video MP4 ke Sini"}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {uploadedFile && !useSampleMode
                    ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB • Siap dirender`
                    : "Langsung dari galeri / komputer Anda (tanpa perlu URL eksternal)"}
                </p>
              </div>
              {uploadedFile && !useSampleMode && (
                <span className="text-[11px] px-2.5 py-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg font-medium">
                  Ganti Video
                </span>
              )}
            </div>

            {/* Alternative: Use Sample Videos */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">Atau gunakan video sampel bawaan:</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:underline cursor-pointer"
                >
                  {showUrlInput ? "Tutup URL" : "Pakai URL Video"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSampleVideo("/samples/sunset.mp4");
                    setUseSampleMode(true);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition text-xs font-medium cursor-pointer ${
                    useSampleMode && selectedSampleVideo === "/samples/sunset.mp4"
                      ? "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <p className="font-semibold truncate">Warm Sunset</p>
                  <p className="text-[10px] text-neutral-500">Video Senja Pantai</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSampleVideo("/samples/nature.mp4");
                    setUseSampleMode(true);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition text-xs font-medium cursor-pointer ${
                    useSampleMode && selectedSampleVideo === "/samples/nature.mp4"
                      ? "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  <p className="font-semibold truncate">Emerald Nature</p>
                  <p className="text-[10px] text-neutral-500">Video Alam Aesthetic</p>
                </button>
              </div>

              {showUrlInput && (
                <div className="pt-2">
                  <input
                    type="url"
                    value={customVideoUrl}
                    onChange={(e) => {
                      setCustomVideoUrl(e.target.value);
                      setUseSampleMode(true);
                    }}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Typography & Caption Input */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                2. Teks & Kategori Story
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(rawText)}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Teks</span>
                  </>
                )}
              </button>
            </div>

            {/* Main Text Input with Format */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="The sunset vibes | Healing, Vitaminsea, Addict"
                className="w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Gunakan format tanda pipa <code>|</code> untuk memisahkan Judul dan Tags.
              </p>
            </div>

            {/* Parsed Structure Preview */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-semibold">
                  Judul:
                </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {parsedData.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-semibold">
                  Tags:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {parsedData.tags.map((tg, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-medium rounded-md"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Preset Options */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-neutral-500 font-medium">Contoh Teks Siap Pakai:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LIST.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      rawText === p.rawText
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Render Engine Mode & Settings */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                3. Mesin Render & Pengaturan
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                0 Beban Disk Server
              </span>
            </div>

            {/* Engine Selection Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Pilih Mesin Pemroses Video:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRenderEngine("browser")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    renderEngine === "browser"
                      ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/80"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      Browser Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    Render langsung di HP/laptop Anda. Tanpa unggah data, bebas lag server & anti-gagal.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRenderEngine("server")}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    renderEngine === "server"
                      ? "border-neutral-900 bg-neutral-50 dark:border-neutral-100 dark:bg-neutral-800/80"
                      : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      Server FFmpeg
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    Backend FFmpeg MP4. Otomatis beralih ke browser jika koneksi terputus.
                  </p>
                </button>
              </div>
            </div>

            {/* Settings Collapsible Button */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full pt-2 flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer"
            >
              <span>Pengaturan Tambahan (Author, Resolusi, Durasi)</span>
              <span className="text-neutral-400 text-xs">{showSettings ? "Tutup" : "Buka"}</span>
            </button>

            {showSettings && (
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3.5 text-xs">
                {/* Author Input */}
                <div className="space-y-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300">
                    Nama Author (storytelling by...)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="nexadev"
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Resolution & Durasi */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300">Resolusi</label>
                    <select
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <option value={540}>540x960 (Cepat ~3-5 detik)</option>
                      <option value={720}>720x1280 (HD Story)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-neutral-700 dark:text-neutral-300">Durasi Video</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <option value={6}>6 Detik</option>
                      <option value={8}>8 Detik (Standar)</option>
                      <option value={10}>10 Detik</option>
                      <option value={15}>15 Detik</option>
                    </select>
                  </div>
                </div>

                {/* Script Word toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Kata Pertama Tulisan Sambung Cursive (RS Script)
                  </span>
                  <input
                    type="checkbox"
                    checked={scriptFirstWord}
                    onChange={(e) => setScriptFirstWord(e.target.checked)}
                    className="rounded accent-neutral-900 dark:accent-neutral-100 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Render Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStartRender}
              disabled={isRendering}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                isRendering
                  ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              }`}
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Merender Video ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Render Video Story Sekarang</span>
                </>
              )}
            </button>

            {isRendering && (
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-300 rounded-full"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>{renderStep}</span>
                  <span>{renderProgress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Render Error Alert */}
          {renderError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Informasi Render</p>
                <p className="text-xs mt-0.5 opacity-90">{renderError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Preview & Result */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Preview Card */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Pratinjau Animasi (9:16)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1 text-neutral-800 dark:text-neutral-200 cursor-pointer transition"
                >
                  {isPlayingPreview ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingPreview ? "Jeda" : "Putar"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTime(0);
                    if (videoPreviewRef.current) {
                      videoPreviewRef.current.currentTime = 0;
                    }
                  }}
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  title="Mulai dari awal"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 9:16 Preview Frame */}
            <div className="relative mx-auto aspect-9/16 max-w-[270px] w-full rounded-xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <video
                ref={videoPreviewRef}
                src={currentVideoSrc}
                loop
                muted
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-mono text-white">
                {previewTime.toFixed(1)}s / {duration}s
              </div>
            </div>

            {/* Timeline Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Timeline Animasi:</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {previewTime.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={previewTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPreviewTime(val);
                  if (videoPreviewRef.current) {
                    videoPreviewRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Render Result Card */}
          {renderedResult && (
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Video Story Siap Ditampilkan
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {renderedResult.duration} Detik • Selesai
                </span>
              </div>

              {/* Rendered Video Player */}
              <div className="aspect-9/16 max-w-[240px] mx-auto rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black">
                <video
                  src={renderedResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={renderedResult.videoUrl}
                  download={renderedResult.filename}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-bold rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Video MP4</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyResultUrl(renderedResult.videoUrl)}
                  className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
                >
                  {copiedResultUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Info Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Info Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
