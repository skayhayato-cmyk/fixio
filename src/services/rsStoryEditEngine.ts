import fs from "fs";
import os from "os";
import path from "path";
import { spawn, execFile } from "child_process";
import { promisify } from "util";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
// @ts-ignore
import ffmpegStatic from "ffmpeg-static";
// @ts-ignore
import ffprobeStatic from "ffprobe-static";

const execFileP = promisify(execFile);

/**
 * Resolves static or system FFmpeg binary path
 */
export function getFfmpegPath(): string {
  try {
    if (ffmpegStatic && typeof ffmpegStatic === "string" && fs.existsSync(ffmpegStatic)) {
      try {
        fs.chmodSync(ffmpegStatic, 0o755);
      } catch {}
      return ffmpegStatic;
    }
  } catch {}

  const candidates = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    "ffmpeg",
  ];
  for (const c of candidates) {
    if (c === "ffmpeg" || fs.existsSync(c)) {
      return c;
    }
  }
  return "ffmpeg";
}

/**
 * Resolves static or system FFprobe binary path
 */
export function getFfprobePath(): string {
  try {
    const p = (ffprobeStatic as any)?.path;
    if (p && typeof p === "string" && fs.existsSync(p)) {
      try {
        fs.chmodSync(p, 0o755);
      } catch {}
      return p;
    }
  } catch {}

  const candidates = [
    "/usr/bin/ffprobe",
    "/usr/local/bin/ffprobe",
    path.join(process.cwd(), "node_modules", "ffprobe-static", "bin", "linux", "x64", "ffprobe"),
    "ffprobe",
  ];
  for (const c of candidates) {
    if (c === "ffprobe" || fs.existsSync(c)) {
      return c;
    }
  }
  return "ffprobe";
}

/* ------------------------------------------------------------------ */
/* FONTS                                                               */
/* ------------------------------------------------------------------ */
const LOCAL_FONT_DIR = path.join(process.cwd(), "fonts");
const TMP_FONT_DIR = path.join(os.tmpdir(), "fixio-fonts");
const GF = "https://raw.githubusercontent.com/google/fonts/main/ofl/";
const FONTS: [string, string, string][] = [
  ["RS Script", "PinyonScript-Regular.ttf", GF + "pinyonscript/PinyonScript-Regular.ttf"],
  ["RS Title", "BebasNeue-Regular.ttf", GF + "bebasneue/BebasNeue-Regular.ttf"],
  ["RS Serif", "InstrumentSerif-Italic.ttf", GF + "instrumentserif/InstrumentSerif-Italic.ttf"],
  ["RS Sans", "Poppins-Regular.ttf", GF + "poppins/Poppins-Regular.ttf"],
  ["RS SansBold", "Poppins-SemiBold.ttf", GF + "poppins/Poppins-SemiBold.ttf"],
];

let fontsReady = false;

export async function ensureFonts() {
  if (fontsReady) return;
  await Promise.all(
    FONTS.map(async ([family, file, url]) => {
      // 1. Try pre-bundled local font first (read-only safe)
      const localPath = path.join(LOCAL_FONT_DIR, file);
      if (fs.existsSync(localPath)) {
        try {
          GlobalFonts.registerFromPath(localPath, family);
          return;
        } catch (e: any) {
          console.warn(`[font] gagal register local ${file}:`, e?.message);
        }
      }

      // 2. Fallback: download to writable /tmp directory if not present
      try {
        fs.mkdirSync(TMP_FONT_DIR, { recursive: true });
      } catch {}
      const tmpPath = path.join(TMP_FONT_DIR, file);
      if (!fs.existsSync(tmpPath)) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
          if (!res.ok) throw new Error("HTTP " + res.status);
          fs.writeFileSync(tmpPath, Buffer.from(await res.arrayBuffer()));
        } catch (e: any) {
          console.warn(`[font] gagal download ${file}: ${e.message}`);
          return;
        }
      }
      try {
        GlobalFonts.registerFromPath(tmpPath, family);
      } catch (e: any) {
        console.warn(`[font] gagal register tmp ${file}:`, e?.message);
      }
    })
  );
  fontsReady = true;
}

/* ------------------------------------------------------------------ */
/* HELPER MATH & CANVAS                                               */
/* ------------------------------------------------------------------ */
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export function rrect(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCover(
  ctx: any,
  img: any,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!img) return;
  const ir = img.width / img.height;
  const r = w / h;
  let sw = img.width;
  let sh = img.height;
  let sx = 0;
  let sy = 0;
  if (ir > r) {
    sw = img.height * r;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / r;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function fitText(ctx: any, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
  return s + "…";
}

/* ------------------------------------------------------------------ */
/* LAYOUT                                                              */
/* ------------------------------------------------------------------ */
export interface Layout {
  W: number;
  H: number;
  S: number;
  F: { x: number; y: number; w: number; h: number; cx: number };
  Y: (k: number) => number;
}

export function buildLayout(W: number, H: number): Layout {
  const S = W / 720;
  const F = {
    x: 30 * S,
    y: 44 * S,
    w: W - 60 * S,
    h: H - 88 * S,
    cx: 0,
  };
  F.cx = F.x + F.w / 2;
  const Y = (k: number) => F.y + F.h * k;
  return { W, H, S, F, Y };
}

export interface TitleInfo {
  script: string;
  lines: string[];
  fs: number;
  fsS: number;
  scriptW: number;
  sq: number;
  capH: number;
  step: number;
  top: number;
  bottom: number;
  left: number;
  scriptBase: number;
}

export function prepareTitle(
  ctx: any,
  L: Layout,
  title: string,
  scriptFirstWord = true
): TitleInfo {
  const { F, S, Y } = L;
  const words = title.trim().split(/\s+/);
  let script = "";
  let main = title.trim().toUpperCase();
  if (scriptFirstWord && words.length >= 2) {
    script = words[0][0].toUpperCase() + words[0].slice(1).toLowerCase();
    main = words.slice(1).join(" ").toUpperCase();
  }

  // Condensed title font
  const SQ = 0.58;
  const maxW = F.w * 0.78;
  const measure = (str: string, size: number) => {
    ctx.font = `${size}px "RS Title", Impact, sans-serif`;
    return ctx.measureText(str).width;
  };

  const base = 190 * S;
  let lines = [main];
  let fs = base * Math.min(1, maxW / (measure(main, base) * SQ));
  const ws = main.split(" ");
  if (fs < 105 * S && ws.length >= 2) {
    let best: { lines: string[]; w: number } | null = null;
    for (let i = 1; i < ws.length; i++) {
      const a = ws.slice(0, i).join(" ");
      const b = ws.slice(i).join(" ");
      const w = Math.max(measure(a, base), measure(b, base));
      if (!best || w < best.w) best = { lines: [a, b], w };
    }
    if (best) {
      lines = best.lines;
      fs = base * Math.min(1, maxW / (best.w * SQ));
    }
  }

  const capH = fs * 0.7;
  const step = fs * 0.84;
  const blockH = capH + (lines.length - 1) * step;
  const top = Y(0.345) - blockH / 2;
  const bottom = top + blockH;
  const natMax = Math.max(...lines.map((l) => measure(l, fs)));
  const left = L.F.cx - (natMax * SQ) / 2;

  // Cursive script word (e.g. "Nature's" or "The")
  let fsS = 0;
  let scriptW = 0;
  if (script) {
    const target = F.w * 0.36;
    ctx.font = `${150 * S}px "RS Script", cursive`;
    const w0 = ctx.measureText(script).width;
    fsS = clamp((150 * S * target) / (w0 || 1), 60 * S, 300 * S);
    ctx.font = `${fsS}px "RS Script", cursive`;
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

/* ------------------------------------------------------------------ */
/* DRAWING LAYERS                                                     */
/* ------------------------------------------------------------------ */
export function drawBackdrop(ctx: any, L: Layout) {
  const g = ctx.createLinearGradient(0, 0, 0, L.H);
  g.addColorStop(0, "rgba(0,10,32,0.50)");
  g.addColorStop(0.5, "rgba(0,10,32,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L.W, L.H);
}

export function drawFrame(ctx: any, L: Layout, t: number) {
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

export function drawTabs(ctx: any, L: Layout, t: number, T: any, tags: string[]) {
  const { F, S, Y } = L;
  const p = easeOutCubic(seg(t, T.tabs, T.tabs + 0.7));
  if (p <= 0 || !tags.length) return;
  const active = Math.floor((tags.length - 1) / 2);
  const gap = 56 * S;
  const padX = 28 * S;
  const maxW = F.w * 0.9;

  let fs = 38 * S;
  const slots = (size: number) => {
    ctx.font = `italic ${size}px "RS Serif", serif`;
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
  ctx.font = `italic ${fs}px "RS Serif", serif`;
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

export function drawTitle(ctx: any, L: Layout, t: number, T: any, ti: TitleInfo) {
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
    ctx.font = `${ti.fs}px "RS Title", Impact, sans-serif`;
    ti.lines.forEach((ln, k) => {
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
      ctx.font = `${ti.fsS}px "RS Script", cursive`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.beginPath();
      ctx.rect(
        ti.left - 40 * S,
        ti.scriptBase - ti.fsS * 1.2,
        (ti.scriptW + 80 * S) * easeOutCubic(q),
        ti.fsS * 1.8
      );
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

export function drawSub(
  ctx: any,
  L: Layout,
  t: number,
  T: any,
  ti: TitleInfo,
  author: string
) {
  const { S } = L;
  const p = easeOutCubic(seg(t, T.sub, T.sub + 0.6));
  if (p <= 0) return;
  const y = ti.bottom + 38 * S;
  const x = ti.left + 8 * S + (1 - p) * -14 * S;
  ctx.save();
  ctx.globalAlpha = p;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${23 * S}px "RS Sans", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const a = "storytelling by ";
  ctx.fillText(a, x, y);
  const wa = ctx.measureText(a).width;
  ctx.font = `italic ${30 * S}px "RS Serif", serif`;
  ctx.fillStyle = "#fff";
  ctx.fillText(author, x + wa, y);
  ctx.restore();
}

export function drawSearch(
  ctx: any,
  L: Layout,
  t: number,
  T: any,
  query: string
) {
  const { F, S, Y } = L;
  const p = easeOutCubic(seg(t, T.search, T.search + 0.6));
  if (p <= 0) return;

  let fs = 27 * S;
  ctx.font = `${fs}px "RS SansBold", sans-serif`;
  const full = ctx.measureText(query).width;
  const w = clamp(full + 130 * S, F.w * 0.46, F.w * 0.84);
  const h = 64 * S;
  const avail = w - 118 * S;
  if (full > avail) {
    fs *= avail / full;
    ctx.font = `${fs}px "RS SansBold", sans-serif`;
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

  // Glass magnifying icon
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

  // Typing text + cursor
  const k = seg(t, T.typeStart, T.typeEnd);
  const typed = query.slice(0, Math.floor(k * query.length + 1e-6));
  const tx = ix + 30 * S;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = `${fs}px "RS SansBold", sans-serif`;
  ctx.fillText(typed, tx, 1 * S);
  const typing = t >= T.typeStart && t < T.typeEnd + 0.9;
  if (typing && Math.floor(t * 2.6) % 2 === 0) {
    const cxp = tx + ctx.measureText(typed).width + 4 * S;
    ctx.fillRect(cxp, -15 * S, 2.5 * S, 30 * S);
  }
  ctx.restore();
}

export function drawCards(
  ctx: any,
  L: Layout,
  t: number,
  T: any,
  imgs: any[]
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
    if (imgs[c.img]) {
      drawCover(ctx, imgs[c.img], -w / 2 + bd, -h / 2 + bd, w - bd * 2, h - bd * 2);
    }
    ctx.restore();
    ctx.restore();
  });
}

export function drawMusic(
  ctx: any,
  L: Layout,
  t: number,
  T: any,
  music: { title: string; sub: string },
  thumb: any
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

  // Mini cover thumb
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

  // Next icon
  const nx = left + w - 58 * S;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(nx - 11 * S, cy - 14 * S);
  ctx.lineTo(nx + 9 * S, cy);
  ctx.lineTo(nx - 11 * S, cy + 14 * S);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(nx + 11 * S, cy - 14 * S, 4 * S, 28 * S);

  // Labels
  const tx = ax + as + 18 * S;
  const maxW = nx - 30 * S - tx;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${27 * S}px "RS SansBold", sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.fillText(fitText(ctx, music.title, maxW), tx, cy - 14 * S);
  ctx.font = `${21 * S}px "RS Sans", sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(fitText(ctx, music.sub, maxW), tx, cy + 18 * S);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* PARSE COMMAND HELPER                                               */
/* ------------------------------------------------------------------ */
/**
 * Parse text like "Nature's whisper | Healing, Serenity, Escapism"
 */
export function parseCommand(text = ""): { title: string; tags: string[] } {
  const [t, tg] = text.split("|");
  const tags = tg
    ? tg
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5)
    : ["Healing", "Serenity", "Escapism"];
  return { title: (t || "Nature's whisper").trim(), tags };
}

/* ------------------------------------------------------------------ */
/* VIDEO UTILITIES                                                    */
/* ------------------------------------------------------------------ */
async function fetchToFile(url: string, dest: string, maxMB = 150) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(180000),
  });
  if (!res.ok) throw new Error(`Gagal download video (HTTP ${res.status})`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > maxMB * 1048576) throw new Error(`Video terlalu besar (maks ${maxMB}MB)`);
  await pipeline(Readable.fromWeb(res.body as any), fs.createWriteStream(dest));
  if (fs.statSync(dest).size > maxMB * 1048576) throw new Error(`Video terlalu besar (maks ${maxMB}MB)`);
}

async function probeDuration(src: string): Promise<number> {
  const ffprobeBin = getFfprobePath();
  try {
    const { stdout } = await execFileP(ffprobeBin, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      src,
    ]);
    const val = parseFloat((stdout || "").trim());
    return isNaN(val) || val <= 0 ? 8 : val;
  } catch (err) {
    console.warn("[probeDuration] ffprobe fallback:", err);
    return 8;
  }
}

async function grabThumbs(src: string, dur: number, dir: string): Promise<Image[]> {
  const ffmpegBin = getFfmpegPath();
  const out: Image[] = [];
  const safeDur = Math.max(1, dur || 8);
  const ks = [0.18, 0.34, 0.5, 0.66, 0.82];
  for (let i = 0; i < ks.length; i++) {
    const f = path.join(dir, `th${i}.jpg`);
    try {
      await execFileP(ffmpegBin, [
        "-v",
        "error",
        "-y",
        "-ss",
        (safeDur * ks[i]).toFixed(2),
        "-i",
        src,
        "-frames:v",
        "1",
        "-vf",
        "scale=480:-2",
        "-q:v",
        "3",
        f,
      ]);
      if (fs.existsSync(f)) {
        out.push(await loadImage(f));
      }
    } catch (e: any) {
      console.warn(`[grabThumbs] frame ${i} extraction failed:`, e?.message);
    }
  }

  // Fallback if no frames could be grabbed (e.g. video too short or unusual format)
  if (out.length === 0) {
    try {
      const fbCanvas = createCanvas(480, 480);
      const fbCtx = fbCanvas.getContext("2d");
      fbCtx.fillStyle = "#1e293b";
      fbCtx.fillRect(0, 0, 480, 480);
      const fbImg = await loadImage(fbCanvas.toBuffer("image/jpeg"));
      for (let i = 0; i < 5; i++) {
        out.push(fbImg);
      }
    } catch (fbErr) {
      console.warn("[grabThumbs] fallback image error:", fbErr);
    }
  } else {
    while (out.length < 5) {
      out.push(out[0]);
    }
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* MAIN RENDER FUNCTION                                                */
/* ------------------------------------------------------------------ */
export interface StoryEditOptions {
  url?: string;
  fileBuffer?: Buffer;
  title?: string;
  tags?: string[];
  author?: string;
  query?: string;
  music?: { title: string; sub: string };
  width?: number;
  fps?: number;
  duration?: number;
  scriptFirstWord?: boolean;
  maxMB?: number;
  output?: string;
  onProgress?: (percent: number) => void;
}

export interface StoryEditResult {
  buffer: Buffer;
  filename: string;
  duration: number;
}

export async function createStoryEdit(o: StoryEditOptions = {}): Promise<StoryEditResult> {
  const {
    url,
    fileBuffer,
    title = "Nature's whisper",
    tags = ["Healing", "Serenity", "Escapism"],
    author = "nexadev",
    width = 720,
    fps = 30,
    scriptFirstWord = true,
    maxMB = 150,
    onProgress,
  } = o;

  if (!url && !fileBuffer) {
    throw new Error("File video atau URL video MP4 wajib diisi.");
  }

  await ensureFonts();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rscanvas-"));

  try {
    let src = path.join(tmp, "bg.mp4");

    if (fileBuffer) {
      fs.writeFileSync(src, fileBuffer);
    } else if (url && /^https?:\/\//i.test(url)) {
      await fetchToFile(url, src, maxMB);
    } else if (url && fs.existsSync(url)) {
      src = url;
    } else if (url && url.startsWith("/")) {
      const publicPath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      if (fs.existsSync(publicPath)) {
        src = publicPath;
      } else {
        throw new Error("File video lokal tidak ditemukan: " + url);
      }
    } else {
      throw new Error("Tautan atau file video tidak valid: " + url);
    }

    const vdur = await probeDuration(src);
    const duration = o.duration || Math.min(15, Math.max(5, vdur));
    const W = Math.round(width / 2) * 2;
    const H = Math.round(((W * 16) / 9) / 2) * 2;
    const L = buildLayout(W, H);

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    const imgs = await grabThumbs(src, vdur, tmp);

    const clean = title.trim();
    const query = (o.query || clean.replace(/^(the|a|an)\s+/i, "")).toLowerCase();
    const music = { title: author, sub: "suara asli", ...(o.music || {}) };
    const ti = prepareTitle(ctx, L, clean, scriptFirstWord);

    const T = { tabs: 0.15, title: 0.55, script: 0.95, sub: 1.5, search: 1.9, typeStart: 2.5, typeEnd: 0, cards: 0, music: 0 };
    T.typeEnd = T.typeStart + Math.max(1.0, query.length * 0.11);
    T.cards = T.typeEnd + 0.3;
    T.music = T.cards + 0.6;

    // Render directly into the temporary directory in /tmp
    const safeTitle = (clean || "story").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
    const outFilename = `storyedit_${safeTitle}_${Date.now()}.mp4`;
    const output = path.join(tmp, "rendered.mp4");

    const filter =
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${fps},` +
      `eq=brightness=-0.04:saturation=1.08[bg];[1:v]format=rgba[ov];` +
      `[bg][ov]overlay=0:0:format=auto,format=yuv420p[v]`;

    const args = [
      "-y",
      "-v",
      "error",
      "-stream_loop",
      "-1",
      "-i",
      src,
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgba",
      "-s",
      `${W}x${H}`,
      "-framerate",
      String(fps),
      "-i",
      "pipe:0",
      "-filter_complex",
      filter,
      "-map",
      "[v]",
      "-map",
      "0:a?",
      "-t",
      String(duration),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      output,
    ];

    const ffmpegBin = getFfmpegPath();
    const ff = spawn(ffmpegBin, args, { stdio: ["pipe", "ignore", "pipe"] });
    let errLog = "";
    ff.stderr.on("data", (d) => {
      errLog = (errLog + d).slice(-4000);
    });
    ff.stdin.on("error", () => {});

    const done = new Promise<void>((res, rej) => {
      ff.on("error", rej);
      ff.on("close", (c) =>
        c === 0 ? res() : rej(new Error("FFmpeg render gagal:\n" + errLog))
      );
    });

    const total = Math.round(duration * fps);
    for (let i = 0; i < total; i++) {
      const t = i / fps;
      ctx.clearRect(0, 0, W, H);
      drawBackdrop(ctx, L);
      drawFrame(ctx, L, t);
      drawTabs(ctx, L, t, T, tags);
      drawTitle(ctx, L, t, T, ti);
      drawSub(ctx, L, t, T, ti, author);
      drawSearch(ctx, L, t, T, query);
      drawCards(ctx, L, t, T, imgs);
      drawMusic(ctx, L, t, T, music, imgs[0]);

      const buf = canvas.data();
      if (!ff.stdin.write(buf)) {
        await Promise.race([
          new Promise((r) => ff.stdin.once("drain", r)),
          done,
        ]);
      }
      if (onProgress && i % 15 === 0) {
        onProgress(Math.round((i / total) * 100));
      }
    }

    ff.stdin.end();
    await done;
    if (onProgress) onProgress(100);

    const buffer = fs.readFileSync(output);

    return {
      buffer,
      filename: outFilename,
      duration,
    };
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}
  }
}
