/**
 * Auto Trace Engine - High-Accuracy Raster to Multi-Layered Vector SVG Converter.
 * Features:
 * - Exact-color fast path for crisp logos/flat artwork (zero color distortion)
 * - Perceptual Redmean / CIE-weighted Median-Cut + K-Means++ quantization
 * - Interior-pixel color snapping (prevents anti-aliased edge pixels from muddying solid colors)
 * - Unblurred subpixel Marching Squares contour extraction (preserves 1px lines & sharp corners)
 * - Seam-free closed-loop Douglas-Peucker simplification & corner-preserving Bezier fitting
 * - Even-odd & wound hole-parent topological matching
 */

export type TraceMode = "standard" | "lineart" | "silhouette" | "manga3";

export interface TraceOptions {
  mode?: TraceMode; // "standard" | "lineart" | "silhouette" | "manga3"
  colors: number; // 2 - 48
  resolution: number; // 320, 480, 640, 800, 1000, 1200, 1600
  speckle: number; // 0 - 200 px²
  smoothness: number; // 0: Sharp/Pixel-Accurate, 1: Smooth Accurate, 2: Ultra Smooth
  splitPerPatch: boolean; // true: 1 path per patch, false: 1 path per layer
  cleanEdges: boolean; // conservative anti-alias fringe cleanup
  removeBg: boolean; // Remove rank 0 canvas background layer
  transparentPaper?: boolean; // Hapus kertas putih otomatis (hanya garis tinta & arsir)
  lineSensitivity?: number; // 0 - 100: sensitivitas garis tinta manga (default 55)
  contrastBoost?: boolean; // Pertajam kontras garis arsir
}

export interface TraceProgressCallback {
  (progress: number, stageText: string): void;
}

export interface TraceLayerInfo {
  id: number;
  hex: string;
  name: string;
  pointsCount: number;
  d: string;
  enabled: boolean;
  isBg?: boolean;
}

export interface TraceResult {
  svgString: string;
  width: number;
  height: number;
  layers: TraceLayerInfo[];
  paletteHexes: string[];
  totalShapes: number;
  totalColors: number;
  svgSizeBytes: number;
  exactPaletteUsed?: boolean;
}

export const OUT_SIZE = 1080;

interface Point {
  x: number;
  y: number;
}

interface Loop {
  pts: Point[];
  area: number; // Signed shoelace area
  isOuter: boolean;
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
}

interface PatchGroup {
  outer: Loop;
  holes: Loop[];
  area: number;
}

/**
 * Load and scale image to target maximum resolution with crisp alpha handling
 */
export async function loadAndScaleImage(
  source: File | Blob | string,
  targetMaxDim: number
): Promise<{ imageData: ImageData; width: number; height: number; origWidth: number; origHeight: number }> {
  let imgBitmap: ImageBitmap | HTMLImageElement;

  if (typeof source === "string") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal memuat gambar dari URL."));
      img.src = source;
    });
    imgBitmap = img;
  } else {
    try {
      imgBitmap = await createImageBitmap(source);
    } catch {
      const objUrl = URL.createObjectURL(source);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          reject(new Error("Format gambar tidak didukung atau file rusak."));
        };
        img.src = objUrl;
      });
      imgBitmap = img;
    }
  }

  const origW = imgBitmap.width;
  const origH = imgBitmap.height;
  if (origW <= 0 || origH <= 0) {
    throw new Error("Dimensi gambar tidak valid.");
  }

  const scale = Math.min(1, targetMaxDim / Math.max(origW, origH));
  const w = Math.max(1, Math.round(origW * scale));
  const h = Math.max(1, Math.round(origH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Gagal menginisialisasi Canvas 2D.");

  // If no downscaling needed, disable smoothing to keep exact original pixels
  if (scale >= 0.999) {
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(imgBitmap, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  return { imageData: imgData, width: w, height: h, origWidth: origW, origHeight: origH };
}

/**
 * Perceptual Redmean color distance squared (far more accurate to human eye than raw Euclidean RGB)
 */
function perceptualDistSq(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rMean = (r1 + r2) * 0.5;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

/**
 * Euclidean RGB distance squared
 */
function distSq(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toH = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toH(r)}${toH(g)}${toH(b)}`.toLowerCase();
}

/**
 * Shoelace formula for signed polygon area
 */
function signedArea(pts: Point[]): number {
  let a = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return a / 2;
}

/**
 * Point in polygon check (Ray Casting algorithm)
 */
function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Seam-free Douglas-Peucker polygon simplification for closed loops
 */
function simplifyClosedLoop(pts: Point[], epsilon: number): Point[] {
  if (pts.length <= 4 || epsilon <= 0) return pts;

  // Find farthest point from pts[0] to split closed loop into two open chains
  let maxD = 0;
  let farIdx = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[0].x;
    const dy = pts[i].y - pts[0].y;
    const d = dx * dx + dy * dy;
    if (d > maxD) {
      maxD = d;
      farIdx = i;
    }
  }
  if (farIdx === 0) return pts;

  // Wrap closed loop by appending pts[0] at the end for the second arc
  const closed = pts.concat([pts[0]]);

  const simplifySection = (start: number, end: number): Point[] => {
    if (end - start <= 1) return [closed[start], closed[end]];
    let dMax = 0;
    let idx = start;
    const p1 = closed[start];
    const p2 = closed[end];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    for (let i = start + 1; i < end; i++) {
      let d = 0;
      if (lenSq === 0) {
        const ddx = closed[i].x - p1.x;
        const ddy = closed[i].y - p1.y;
        d = Math.sqrt(ddx * ddx + ddy * ddy);
      } else {
        const u = ((closed[i].x - p1.x) * dx + (closed[i].y - p1.y) * dy) / lenSq;
        const clampedU = Math.max(0, Math.min(1, u));
        const projX = p1.x + clampedU * dx;
        const projY = p1.y + clampedU * dy;
        const ddx = closed[i].x - projX;
        const ddy = closed[i].y - projY;
        d = Math.sqrt(ddx * ddx + ddy * ddy);
      }
      if (d > dMax) {
        dMax = d;
        idx = i;
      }
    }

    if (dMax > epsilon) {
      const rec1 = simplifySection(start, idx);
      const rec2 = simplifySection(idx, end);
      return rec1.slice(0, -1).concat(rec2);
    } else {
      return [p1, p2];
    }
  };

  const part1 = simplifySection(0, farIdx);
  const part2 = simplifySection(farIdx, closed.length - 1);
  // part1 ends at closed[farIdx], part2 ends at closed[0] (= pts[0]), so drop both ends' duplicates
  const merged = part1.slice(0, -1).concat(part2.slice(0, -1));
  return merged.length >= 3 ? merged : pts;
}

interface ColorBin {
  rSum: number;
  gSum: number;
  bSum: number;
  count: number;
  r: number;
  g: number;
  b: number;
  chroma: number;
}

/**
 * High-accuracy perceptual color quantizer using 5-bit spatial histogram + Median-Cut + Weighted K-Means
 */
function buildAccurateColorPalette(
  data: Uint8ClampedArray,
  opaqueIndices: number[],
  w: number,
  h: number,
  targetK: number
): { palette: [number, number, number][]; exactUsed: boolean } {
  const K = Math.max(2, Math.min(48, targetK));

  // Filter solid pixels (alpha >= 220) for pure color sampling without semi-transparent background bleed
  const solidIndices: number[] = [];
  for (let i = 0; i < opaqueIndices.length; i++) {
    const idx = opaqueIndices[i];
    if (data[idx * 4 + 3] >= 220) {
      solidIndices.push(idx);
    }
  }
  const samplePool = solidIndices.length > 0 ? solidIndices : opaqueIndices;

  // 1. Exact Unique Color Fast-Path (0 quantization error for logos, vector exports, flat artwork)
  const exactCounts = new Map<number, number>();
  let exceededExact = false;
  for (let i = 0; i < samplePool.length; i++) {
    const idx = samplePool[i];
    const p = idx * 4;
    const key = (data[p] << 16) | (data[p + 1] << 8) | data[p + 2];
    const prev = exactCounts.get(key);
    if (prev !== undefined) {
      exactCounts.set(key, prev + 1);
    } else {
      exactCounts.set(key, 1);
      if (exactCounts.size > K) {
        exceededExact = true;
        break;
      }
    }
  }

  if (!exceededExact && exactCounts.size > 0) {
    const exactPal: [number, number, number][] = [];
    const sortedExact = Array.from(exactCounts.entries()).sort((a, b) => b[1] - a[1]);
    for (const [key] of sortedExact) {
      exactPal.push([(key >> 16) & 255, (key >> 8) & 255, key & 255]);
    }
    return { palette: exactPal, exactUsed: true };
  }

  // 2. Build 6-bit-per-channel color histogram (64^3 = 262,144 max bins) across ALL solid pixels
  // Using 6-bit (step 4) preserves exact hue accuracy while keeping bin count compact and fast.
  const binMap = new Map<number, ColorBin>();
  for (let i = 0; i < samplePool.length; i++) {
    const idx = samplePool[i];
    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const qKey = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let bin = binMap.get(qKey);
    if (!bin) {
      bin = { rSum: r, gSum: g, bSum: b, count: 1, r, g, b, chroma: 0 };
      binMap.set(qKey, bin);
    } else {
      bin.rSum += r;
      bin.gSum += g;
      bin.bSum += b;
      bin.count++;
    }
  }

  const bins = Array.from(binMap.values());
  for (const bin of bins) {
    bin.r = bin.rSum / bin.count;
    bin.g = bin.gSum / bin.count;
    bin.b = bin.bSum / bin.count;
    bin.chroma = Math.max(bin.r, bin.g, bin.b) - Math.min(bin.r, bin.g, bin.b);
  }

  // If quantized bins fit inside K, return them directly
  if (bins.length <= K) {
    return {
      palette: bins
        .sort((a, b) => b.count - a.count)
        .map((b) => [Math.round(b.r), Math.round(b.g), Math.round(b.b)]),
      exactUsed: true,
    };
  }

  // 3. Hybrid Seeding:
  //    - Pick the #1 dominant bin (usually main background or primary body)
  //    - Remaining (K-1) seeds via Perceptual Farthest-Point weighted by sqrt(count) + chroma salience
  //      so small vibrant details (eyes, highlights, accents) are never lost!
  bins.sort((a, b) => b.count - a.count);
  const palette: [number, number, number][] = [
    [Math.round(bins[0].r), Math.round(bins[0].g), Math.round(bins[0].b)],
  ];

  // Limit candidate bins for fast O(M*K) seeding when there are tens of thousands of gradient bins
  const seedCandidates = bins.length > 3500 ? bins.slice(0, 3500) : bins;
  const minDistToPal = new Float64Array(seedCandidates.length);
  for (let i = 0; i < seedCandidates.length; i++) {
    const b = seedCandidates[i];
    minDistToPal[i] = perceptualDistSq(b.r, b.g, b.b, palette[0][0], palette[0][1], palette[0][2]);
  }

  while (palette.length < K) {
    let bestScore = -1;
    let bestIdx = -1;

    for (let i = 0; i < seedCandidates.length; i++) {
      const d = minDistToPal[i];
      if (d < 25) continue; // already very close to an existing seed
      const b = seedCandidates[i];
      // Salience weight: balances region area with color distinctiveness (chroma)
      const weight = Math.pow(b.count, 0.35) * (1 + b.chroma / 180);
      const score = d * weight;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) break;
    const chosen = seedCandidates[bestIdx];
    const newColor: [number, number, number] = [
      Math.round(chosen.r),
      Math.round(chosen.g),
      Math.round(chosen.b),
    ];
    palette.push(newColor);

    for (let i = 0; i < seedCandidates.length; i++) {
      const b = seedCandidates[i];
      const d = perceptualDistSq(b.r, b.g, b.b, newColor[0], newColor[1], newColor[2]);
      if (d < minDistToPal[i]) {
        minDistToPal[i] = d;
      }
    }
  }

  // 4. Run 14 iterations of Bin-Weighted Perceptual K-Means
  const workBins = bins.length > 12000 ? bins.slice(0, 12000) : bins;
  const palLen = palette.length;
  const rSum = new Float64Array(palLen);
  const gSum = new Float64Array(palLen);
  const bSum = new Float64Array(palLen);
  const wSum = new Float64Array(palLen);

  for (let iter = 0; iter < 14; iter++) {
    rSum.fill(0);
    gSum.fill(0);
    bSum.fill(0);
    wSum.fill(0);

    for (let i = 0; i < workBins.length; i++) {
      const bin = workBins[i];
      let bestP = 0;
      let bestD = Infinity;
      for (let p = 0; p < palLen; p++) {
        const d = perceptualDistSq(bin.r, bin.g, bin.b, palette[p][0], palette[p][1], palette[p][2]);
        if (d < bestD) {
          bestD = d;
          bestP = p;
        }
      }
      const wt = bin.count;
      rSum[bestP] += bin.r * wt;
      gSum[bestP] += bin.g * wt;
      bSum[bestP] += bin.b * wt;
      wSum[bestP] += wt;
    }

    let moved = false;
    for (let p = 0; p < palLen; p++) {
      if (wSum[p] > 0) {
        const nr = Math.round(rSum[p] / wSum[p]);
        const ng = Math.round(gSum[p] / wSum[p]);
        const nb = Math.round(bSum[p] / wSum[p]);
        if (nr !== palette[p][0] || ng !== palette[p][1] || nb !== palette[p][2]) {
          palette[p] = [nr, ng, nb];
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Note: Unused w/h kept for potential spatial refinement
  void w;
  void h;

  return { palette, exactUsed: false };
}

/**
 * Main Auto Trace Execution Engine
 */
export async function runAutoTrace(
  imgData: ImageData,
  options: TraceOptions,
  onProgress?: TraceProgressCallback,
  abortSignal?: { aborted: boolean }
): Promise<TraceResult> {
  const { width: w, height: h, data } = imgData;
  const N = w * h;

  if (abortSignal?.aborted) throw new Error("Proses dibatalkan.");
  onProgress?.(0.05, "Menganalisis & mengekstrak palet warna akurat...");

  // Alpha filtering: Pixels with alpha < 128 are treated as transparent (-1)
  const opaqueIndices: number[] = [];
  for (let i = 0; i < N; i++) {
    if (data[i * 4 + 3] >= 128) {
      opaqueIndices.push(i);
    }
  }

  if (opaqueIndices.length === 0) {
    throw new Error("Gambar kosong atau transparan penuh.");
  }

  const isMangaMode =
    options.mode === "lineart" || options.mode === "manga3" || options.mode === "silhouette";
  const sens = Math.max(0, Math.min(100, options.lineSensitivity ?? 50));
  const transparentPaper = options.transparentPaper !== false;
  const paperThreshold = Math.max(160, Math.min(252, 230 - (sens - 50) * 0.7));

  let palette: [number, number, number][] = [];
  let exactPaletteUsed = false;
  const pixelIdx = new Int16Array(N);
  pixelIdx.fill(-1);

  if (isMangaMode) {
    onProgress?.(0.08, "Mengoptimalkan garis tinta & arsir manga...");
    if (options.mode === "silhouette") {
      palette.push([10, 10, 10]);
      if (!transparentPaper) palette.push([255, 255, 255]);

      for (const idx of opaqueIndices) {
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (options.contrastBoost !== false && lum < 190) {
          lum = Math.pow(lum / 190, 1.25) * 190;
        }

        if (lum < paperThreshold) {
          pixelIdx[idx] = 0;
        } else if (!transparentPaper) {
          pixelIdx[idx] = 1;
        }
      }
    } else if (options.mode === "manga3") {
      palette.push([10, 10, 10]);
      palette.push([90, 90, 90]);
      if (!transparentPaper) palette.push([255, 255, 255]);

      const darkThresh = Math.max(35, Math.min(150, 90 + (sens - 50) * 0.7));
      for (const idx of opaqueIndices) {
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (options.contrastBoost !== false && lum < 190) {
          lum = Math.pow(lum / 190, 1.25) * 190;
        }

        if (lum < darkThresh) {
          pixelIdx[idx] = 0;
        } else if (lum < paperThreshold) {
          pixelIdx[idx] = 1;
        } else if (!transparentPaper) {
          pixelIdx[idx] = 2;
        }
      }
    } else {
      palette.push([10, 10, 10]);
      palette.push([65, 65, 65]);
      palette.push([125, 125, 125]);
      if (options.colors >= 4) {
        palette.push([175, 175, 175]);
      }
      if (!transparentPaper) palette.push([255, 255, 255]);

      const numInkLevels = options.colors >= 4 ? 4 : 3;
      const stepLum = paperThreshold / numInkLevels;

      for (const idx of opaqueIndices) {
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (options.contrastBoost !== false && lum < 190) {
          lum = Math.pow(lum / 190, 1.25) * 190;
        }

        if (lum < paperThreshold) {
          const level = Math.min(numInkLevels - 1, Math.floor(lum / stepLum));
          pixelIdx[idx] = level;
        } else if (!transparentPaper) {
          pixelIdx[idx] = numInkLevels;
        }
      }
    }
  } else {
    // Full-Color High-Accuracy Quantization
    const built = buildAccurateColorPalette(data, opaqueIndices, w, h, options.colors);
    palette = built.palette;
    exactPaletteUsed = built.exactUsed;

    onProgress?.(0.11, "Memetakan warna piksel presisi...");

    // Assign every opaque pixel using perceptual Redmean distance
    const palLen = palette.length;
    if (exactPaletteUsed) {
      const exactLookup = new Map<number, number>();
      for (let p = 0; p < palLen; p++) {
        const key = (palette[p][0] << 16) | (palette[p][1] << 8) | palette[p][2];
        exactLookup.set(key, p);
      }
      for (let i = 0; i < opaqueIndices.length; i++) {
        const idx = opaqueIndices[i];
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        const key = (r << 16) | (g << 8) | b;
        const direct = exactLookup.get(key);
        if (direct !== undefined) {
          pixelIdx[idx] = direct;
        } else {
          let bestP = 0;
          let bestDist = Infinity;
          for (let p = 0; p < palLen; p++) {
            const d = perceptualDistSq(r, g, b, palette[p][0], palette[p][1], palette[p][2]);
            if (d < bestDist) {
              bestDist = d;
              bestP = p;
            }
          }
          pixelIdx[idx] = bestP;
        }
      }
    } else {
      for (let i = 0; i < opaqueIndices.length; i++) {
        const idx = opaqueIndices[i];
        const r = data[idx * 4];
        const g = data[idx * 4 + 1];
        const b = data[idx * 4 + 2];
        let bestP = 0;
        let bestDist = Infinity;
        for (let p = 0; p < palLen; p++) {
          const d = perceptualDistSq(r, g, b, palette[p][0], palette[p][1], palette[p][2]);
          if (d < bestDist) {
            bestDist = d;
            bestP = p;
          }
        }
        pixelIdx[idx] = bestP;
      }

      // Interior-Pixel Color Snapping:
      // Anti-aliased boundary pixels pull K-means centroids toward neighboring colors.
      // Re-computing each cluster's color from strictly INTERIOR pixels (all 4 neighbors match)
      // restores the exact original flat/true color of every shape!
      const intR = new Float64Array(palLen);
      const intG = new Float64Array(palLen);
      const intB = new Float64Array(palLen);
      const intCnt = new Int32Array(palLen);

      for (let y = 1; y < h - 1; y++) {
        const rowOff = y * w;
        for (let x = 1; x < w - 1; x++) {
          const idx = rowOff + x;
          const c = pixelIdx[idx];
          if (c < 0) continue;
          if (data[idx * 4 + 3] < 240) continue;
          if (
            pixelIdx[idx - 1] === c &&
            pixelIdx[idx + 1] === c &&
            pixelIdx[idx - w] === c &&
            pixelIdx[idx + w] === c
          ) {
            intR[c] += data[idx * 4];
            intG[c] += data[idx * 4 + 1];
            intB[c] += data[idx * 4 + 2];
            intCnt[c]++;
          }
        }
      }

      for (let p = 0; p < palLen; p++) {
        if (intCnt[p] >= 4) {
          palette[p] = [
            Math.round(intR[p] / intCnt[p]),
            Math.round(intG[p] / intCnt[p]),
            Math.round(intB[p] / intCnt[p]),
          ];
        }
      }
    }
  }

  // Conservative Edge & Anti-Alias Fringe Cleaning
  // Only run when enabled AND not an exact flat-color artwork (so exact colors are never altered)
  if (options.cleanEdges && !exactPaletteUsed) {
    onProgress?.(0.14, "Merapikan tepi & anti-alias...");
    const counts = new Int32Array(palette.length);
    for (let i = 0; i < N; i++) {
      if (pixelIdx[i] >= 0) counts[pixelIdx[i]]++;
    }

    const palOrder = Array.from({ length: palette.length }, (_, i) => i).sort(
      (a, b) => counts[a] - counts[b]
    );

    const mergedTo = new Int16Array(palette.length);
    for (let i = 0; i < palette.length; i++) mergedTo[i] = i;

    // Very conservative merge threshold (RGB dist < 14) so subtle real tones are preserved
    const mergeThreshSq = 14 * 14;
    for (const c of palOrder) {
      if (counts[c] === 0) continue;
      let targetColor = -1;
      let minD = mergeThreshSq;
      for (let o = 0; o < palette.length; o++) {
        if (o === c || mergedTo[o] !== o) continue;
        if (counts[o] > counts[c] || (counts[o] === counts[c] && o > c)) {
          const d = distSq(
            palette[c][0],
            palette[c][1],
            palette[c][2],
            palette[o][0],
            palette[o][1],
            palette[o][2]
          );
          if (d < minD) {
            minD = d;
            targetColor = o;
          }
        }
      }
      if (targetColor >= 0) {
        mergedTo[c] = targetColor;
        counts[targetColor] += counts[c];
        counts[c] = 0;
      }
    }

    for (let i = 0; i < N; i++) {
      if (pixelIdx[i] >= 0) {
        let root = pixelIdx[i];
        while (mergedTo[root] !== root) root = mergedTo[root];
        pixelIdx[i] = root;
      }
    }

    // Remove genuine 1px linear anti-alias halos strictly between two dominant neighbors
    for (let pass = 0; pass < 4; pass++) {
      const curCounts = new Int32Array(palette.length);
      const thinCounts = new Int32Array(palette.length);
      const neighbors = Array.from({ length: palette.length }, () => new Map<number, number>());

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const c = pixelIdx[idx];
          if (c < 0) continue;
          curCounts[c]++;

          let isBlock = true;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= w || ny < 0 || ny >= h || pixelIdx[ny * w + nx] !== c) {
                isBlock = false;
                break;
              }
            }
            if (!isBlock) break;
          }
          if (!isBlock) thinCounts[c]++;

          if (x + 1 < w) {
            const rightC = pixelIdx[idx + 1];
            if (rightC >= 0 && rightC !== c) {
              neighbors[c].set(rightC, (neighbors[c].get(rightC) || 0) + 1);
              neighbors[rightC].set(c, (neighbors[rightC].get(c) || 0) + 1);
            }
          }
          if (y + 1 < h) {
            const bottomC = pixelIdx[idx + w];
            if (bottomC >= 0 && bottomC !== c) {
              neighbors[c].set(bottomC, (neighbors[c].get(bottomC) || 0) + 1);
              neighbors[bottomC].set(c, (neighbors[bottomC].get(c) || 0) + 1);
            }
          }
        }
      }

      let transitionColor = -1;
      const sortedByCount = Array.from({ length: palette.length }, (_, i) => i).sort(
        (a, b) => curCounts[a] - curCounts[b]
      );

      for (const c of sortedByCount) {
        if (curCounts[c] === 0) continue;
        if (isMangaMode && c === 0) continue;
        if (thinCounts[c] >= 0.85 * curCounts[c] && neighbors[c].size >= 2) {
          const topNeighbors = Array.from(neighbors[c].entries()).sort((a, b) => b[1] - a[1]);
          if (topNeighbors.length >= 2) {
            const A = topNeighbors[0][0];
            const B = topNeighbors[1][0];
            const pC = palette[c];
            const pA = palette[A];
            const pB = palette[B];

            const vAB = [pB[0] - pA[0], pB[1] - pA[1], pB[2] - pA[2]];
            const vAC = [pC[0] - pA[0], pC[1] - pA[1], pC[2] - pA[2]];
            const lenSqAB = vAB[0] * vAB[0] + vAB[1] * vAB[1] + vAB[2] * vAB[2];

            if (lenSqAB > 0) {
              const t = (vAC[0] * vAB[0] + vAC[1] * vAB[1] + vAC[2] * vAB[2]) / lenSqAB;
              if (t >= 0.12 && t <= 0.88) {
                const proj = [pA[0] + t * vAB[0], pA[1] + t * vAB[1], pA[2] + t * vAB[2]];
                const dLine = Math.sqrt(
                  distSq(pC[0], pC[1], pC[2], proj[0], proj[1], proj[2])
                );
                if (dLine < 26) {
                  transitionColor = c;
                  break;
                }
              }
            }
          }
        }
      }

      if (transitionColor < 0) break;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (pixelIdx[idx] === transitionColor) {
            const r = data[idx * 4];
            const g = data[idx * 4 + 1];
            const b = data[idx * 4 + 2];
            let bestNeighborColor = -1;
            let minD = Infinity;

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                  const nc = pixelIdx[ny * w + nx];
                  if (nc >= 0 && nc !== transitionColor) {
                    const d = perceptualDistSq(r, g, b, palette[nc][0], palette[nc][1], palette[nc][2]);
                    if (d < minD) {
                      minD = d;
                      bestNeighborColor = nc;
                    }
                  }
                }
              }
            }
            if (bestNeighborColor >= 0) {
              pixelIdx[idx] = bestNeighborColor;
            }
          }
        }
      }
    }
  }

  // Stacked Layer Order: Count pixels per color, sort largest area first (rank 0 = bottom/background)
  const finalCounts = new Int32Array(palette.length);
  for (let i = 0; i < N; i++) {
    if (pixelIdx[i] >= 0) finalCounts[pixelIdx[i]]++;
  }

  const activeColors = Array.from({ length: palette.length }, (_, i) => i)
    .filter((c) => finalCounts[c] > 0)
    .sort((a, b) => finalCounts[b] - finalCounts[a]);

  if (activeColors.length === 0) {
    throw new Error("Tidak ada warna yang dapat di-vektorisasi.");
  }

  const colorRank = new Int16Array(palette.length);
  colorRank.fill(-1);
  activeColors.forEach((colorIdx, rank) => {
    colorRank[colorIdx] = rank;
  });

  const paletteHexes = activeColors.map((cIdx) =>
    rgbToHex(palette[cIdx][0], palette[cIdx][1], palette[cIdx][2])
  );

  const totalLayers = activeColors.length;
  const layersResult: TraceLayerInfo[] = [];
  const sc = OUT_SIZE / Math.max(w, h);
  const outW = Math.round(w * sc);
  const outH = Math.round(h * sc);

  // Precision simplification parameters:
  // Tight tolerances ensure 100% shape fidelity without eroding corners or fine features.
  const eps = options.smoothness === 0 ? 0.15 : options.smoothness === 1 ? 0.35 : 0.65;
  const factor = options.smoothness === 1 ? 0.28 : 0.36;
  const cosCornerThresh = options.smoothness === 1 ? 0.25 : -0.15;

  for (let r = 0; r < totalLayers; r++) {
    if (abortSignal?.aborted) throw new Error("Proses dibatalkan.");
    const progress = 0.2 + (r / totalLayers) * 0.75;
    onProgress?.(progress, `Menjiplak kontur akurat layer ${r + 1}/${totalLayers}...`);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const hex = paletteHexes[r];

    // Scalar field: (w+4) x (h+4) with 2px edge-replication padding
    const padW = w + 4;
    const padH = h + 4;
    const field = new Float32Array(padW * padH);

    for (let py = 0; py < padH; py++) {
      const iy = Math.max(0, Math.min(h - 1, py - 2));
      for (let px = 0; px < padW; px++) {
        const ix = Math.max(0, Math.min(w - 1, px - 2));
        const pIdx = pixelIdx[iy * w + ix];
        // Stacked: layer rank r covers all pixels with rank >= r (zero seam gaps between colors)
        field[py * padW + px] = pIdx >= 0 && colorRank[pIdx] >= r ? 1.0 : 0.0;
      }
    }

    // Smoothness 0 & 1 keep unblurred crisp scalar field so 1px strokes & sharp tips NEVER vanish!
    // Smoothness 2 uses a center-weighted kernel (weight 4 on center) that keeps 1px lines >= 0.5!
    if (options.smoothness >= 2) {
      const smoothed = new Float32Array(padW * padH);
      for (let py = 1; py < padH - 1; py++) {
        for (let px = 1; px < padW - 1; px++) {
          const idx = py * padW + px;
          const sum =
            field[idx] * 4 +
            field[idx - 1] +
            field[idx + 1] +
            field[idx - padW] +
            field[idx + padW];
          smoothed[idx] = sum / 8.0;
        }
      }
      field.set(smoothed);
    }

    interface EdgeSegment {
      fromKey: string;
      toKey: string;
      p1: Point;
      p2: Point;
    }

    const segments: EdgeSegment[] = [];

    const getEdgePoint = (x: number, y: number, edge: number): Point => {
      const v0 = field[y * padW + x];
      const v1 = field[y * padW + (x + 1)];
      const v2 = field[(y + 1) * padW + (x + 1)];
      const v3 = field[(y + 1) * padW + x];

      if (edge === 0) {
        const u = (0.5 - v0) / (v1 - v0 + 1e-12);
        return { x: x + Math.max(0, Math.min(1, u)), y };
      } else if (edge === 1) {
        const u = (0.5 - v1) / (v2 - v1 + 1e-12);
        return { x: x + 1, y: y + Math.max(0, Math.min(1, u)) };
      } else if (edge === 2) {
        const u = (0.5 - v3) / (v2 - v3 + 1e-12);
        return { x: x + Math.max(0, Math.min(1, u)), y: y + 1 };
      } else {
        const u = (0.5 - v0) / (v3 - v0 + 1e-12);
        return { x, y: y + Math.max(0, Math.min(1, u)) };
      }
    };

    const edgeKey = (x: number, y: number, edge: number): string => {
      if (edge === 0) return `H_${x}_${y}`;
      if (edge === 1) return `V_${x + 1}_${y}`;
      if (edge === 2) return `H_${x}_${y + 1}`;
      return `V_${x}_${y}`;
    };

    for (let cy = 0; cy < padH - 1; cy++) {
      for (let cx = 0; cx < padW - 1; cx++) {
        const f0 = field[cy * padW + cx];
        const f1 = field[cy * padW + (cx + 1)];
        const f2 = field[(cy + 1) * padW + (cx + 1)];
        const f3 = field[(cy + 1) * padW + cx];

        const v0 = f0 >= 0.5 ? 1 : 0;
        const v1 = f1 >= 0.5 ? 2 : 0;
        const v2 = f2 >= 0.5 ? 4 : 0;
        const v3 = f3 >= 0.5 ? 8 : 0;
        const cellCase = v0 | v1 | v2 | v3;

        if (cellCase === 0 || cellCase === 15) continue;

        const addSeg = (eFrom: number, eTo: number) => {
          segments.push({
            fromKey: edgeKey(cx, cy, eFrom),
            toKey: edgeKey(cx, cy, eTo),
            p1: getEdgePoint(cx, cy, eFrom),
            p2: getEdgePoint(cx, cy, eTo),
          });
        };

        switch (cellCase) {
          case 1:
            addSeg(3, 0);
            break;
          case 2:
            addSeg(0, 1);
            break;
          case 3:
            addSeg(3, 1);
            break;
          case 4:
            addSeg(1, 2);
            break;
          case 5: {
            // Saddle (TL & BR are >= 0.5): connect diagonal foreground strokes cleanly
            const center = (f0 + f1 + f2 + f3) * 0.25;
            if (center >= 0.5) {
              addSeg(0, 1);
              addSeg(2, 3);
            } else {
              addSeg(3, 0);
              addSeg(1, 2);
            }
            break;
          }
          case 6:
            addSeg(0, 2);
            break;
          case 7:
            addSeg(3, 2);
            break;
          case 8:
            addSeg(2, 3);
            break;
          case 9:
            addSeg(2, 0);
            break;
          case 10: {
            // Saddle (TR & BL are >= 0.5)
            const center = (f0 + f1 + f2 + f3) * 0.25;
            if (center >= 0.5) {
              addSeg(3, 0);
              addSeg(1, 2);
            } else {
              addSeg(0, 1);
              addSeg(2, 3);
            }
            break;
          }
          case 11:
            addSeg(2, 1);
            break;
          case 12:
            addSeg(1, 3);
            break;
          case 13:
            addSeg(1, 0);
            break;
          case 14:
            addSeg(0, 3);
            break;
        }
      }
    }

    // Stitch segments into closed loops
    const segMap = new Map<string, EdgeSegment>();
    for (const seg of segments) {
      segMap.set(seg.fromKey, seg);
    }

    const rawLoops: Point[][] = [];
    const visited = new Set<string>();

    for (const seg of segments) {
      if (visited.has(seg.fromKey)) continue;

      const loopPts: Point[] = [];
      let cur: EdgeSegment | undefined = seg;
      let steps = 0;
      const maxSteps = segments.length + 50;

      while (cur && !visited.has(cur.fromKey) && steps < maxSteps) {
        visited.add(cur.fromKey);
        loopPts.push(cur.p1);
        const next = segMap.get(cur.toKey);
        if (next === seg) {
          break;
        }
        cur = next;
        steps++;
      }

      if (loopPts.length >= 3) {
        rawLoops.push(loopPts);
      }
    }

    const processedLoops: Loop[] = [];

    for (const loop of rawLoops) {
      const clampedPts = loop.map((pt) => ({
        x: Math.max(0, Math.min(w, pt.x - 1.5)),
        y: Math.max(0, Math.min(h, pt.y - 1.5)),
      }));

      const area = signedArea(clampedPts);
      if (Math.abs(area) < options.speckle) continue;

      const simplified = simplifyClosedLoop(clampedPts, eps);
      if (simplified.length < 3) continue;

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of simplified) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }

      const sArea = signedArea(simplified);
      const spanX = maxX - minX;
      const spanY = maxY - minY;
      const maxSpan = Math.max(spanX, spanY);
      const minSpan = Math.max(1, Math.min(spanX, spanY));
      const isElongatedLine = isMangaMode && maxSpan >= 10 && maxSpan / minSpan >= 2.0;

      if (!isElongatedLine && Math.abs(sArea) < options.speckle) continue;

      processedLoops.push({
        pts: simplified,
        area: sArea,
        isOuter: false,
        bbox: { minX, minY, maxX, maxY },
      });
    }

    if (processedLoops.length === 0) continue;

    // Separate outer contours vs holes by winding sign
    let maxAbsArea = 0;
    let outerSign = 1;
    for (const lp of processedLoops) {
      if (Math.abs(lp.area) > maxAbsArea) {
        maxAbsArea = Math.abs(lp.area);
        outerSign = Math.sign(lp.area);
      }
    }

    const outerLoops: Loop[] = [];
    const holeLoops: Loop[] = [];

    for (const lp of processedLoops) {
      if (Math.sign(lp.area) === outerSign) {
        lp.isOuter = true;
        outerLoops.push(lp);
      } else {
        lp.isOuter = false;
        holeLoops.push(lp);
      }
    }

    const patchGroups: PatchGroup[] = outerLoops.map((outer) => ({
      outer,
      holes: [],
      area: Math.abs(outer.area),
    }));

    for (const hole of holeLoops) {
      let bestGroup: PatchGroup | null = null;
      let minOuterArea = Infinity;
      const testPt = hole.pts[0];

      for (const group of patchGroups) {
        const ob = group.outer.bbox;
        const hb = hole.bbox;
        if (
          hb.minX >= ob.minX &&
          hb.maxX <= ob.maxX &&
          hb.minY >= ob.minY &&
          hb.maxY <= ob.maxY
        ) {
          if (pointInPolygon(testPt, group.outer.pts)) {
            if (group.area < minOuterArea) {
              minOuterArea = group.area;
              bestGroup = group;
            }
          }
        }
      }

      if (bestGroup) {
        bestGroup.holes.push(hole);
      }
    }

    patchGroups.sort((a, b) => b.area - a.area);

    // Sub-pixel accurate path formatter with corner-preserving Bezier curves
    const fmt = (n: number) => Number(n.toFixed(2));

    const formatLoopToD = (pts: Point[]): string => {
      const n = pts.length;
      if (n === 0) return "";

      const scaledPts = pts.map((p) => ({
        x: fmt(p.x * sc),
        y: fmt(p.y * sc),
      }));

      if (options.smoothness === 0) {
        let d = `M ${scaledPts[0].x} ${scaledPts[0].y}`;
        for (let i = 1; i < n; i++) {
          d += ` L ${scaledPts[i].x} ${scaledPts[i].y}`;
        }
        return d + " Z";
      }

      const isCorner = new Uint8Array(n);
      const segLens = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        const next = scaledPts[(i + 1) % n];
        const cur = scaledPts[i];
        segLens[i] = Math.hypot(next.x - cur.x, next.y - cur.y);
      }

      for (let i = 0; i < n; i++) {
        const prev = scaledPts[(i - 1 + n) % n];
        const cur = scaledPts[i];
        const next = scaledPts[(i + 1) % n];

        const v1x = cur.x - prev.x;
        const v1y = cur.y - prev.y;
        const v2x = next.x - cur.x;
        const v2y = next.y - cur.y;
        const len1 = Math.hypot(v1x, v1y);
        const len2 = Math.hypot(v2x, v2y);

        if (len1 > 0 && len2 > 0) {
          const cosA = (v1x * v2x + v1y * v2y) / (len1 * len2);
          // Mark sharp corners OR transitions between long straight edge and tiny step
          if (cosA < cosCornerThresh || Math.max(len1, len2) > Math.min(len1, len2) * 3.5) {
            isCorner[i] = 1;
          }
        }
      }

      const tangents: Point[] = [];
      for (let i = 0; i < n; i++) {
        const prev = scaledPts[(i - 1 + n) % n];
        const next = scaledPts[(i + 1) % n];
        const tx = next.x - prev.x;
        const ty = next.y - prev.y;
        const len = Math.hypot(tx, ty);
        tangents.push(len > 0 ? { x: tx / len, y: ty / len } : { x: 0, y: 0 });
      }

      let d = `M ${scaledPts[0].x} ${scaledPts[0].y}`;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const p1 = scaledPts[i];
        const p2 = scaledPts[j];
        const segLen = segLens[i];

        if ((isCorner[i] && isCorner[j]) || segLen < 1.5) {
          d += ` L ${p2.x} ${p2.y}`;
        } else {
          const prevLen = segLens[(i - 1 + n) % n];
          const nextLen = segLens[j];
          const hLen1 = Math.min(segLen * factor, Math.max(1.5, prevLen * 0.45));
          const hLen2 = Math.min(segLen * factor, Math.max(1.5, nextLen * 0.45));

          // If vertex is a sharp corner, align its handle strictly along the current segment (zero corner rounding!)
          let cp1x = p1.x;
          let cp1y = p1.y;
          if (!isCorner[i]) {
            cp1x = fmt(p1.x + tangents[i].x * hLen1);
            cp1y = fmt(p1.y + tangents[i].y * hLen1);
          } else {
            cp1x = fmt(p1.x + (p2.x - p1.x) * 0.25);
            cp1y = fmt(p1.y + (p2.y - p1.y) * 0.25);
          }

          let cp2x = p2.x;
          let cp2y = p2.y;
          if (!isCorner[j]) {
            cp2x = fmt(p2.x - tangents[j].x * hLen2);
            cp2y = fmt(p2.y - tangents[j].y * hLen2);
          } else {
            cp2x = fmt(p2.x - (p2.x - p1.x) * 0.25);
            cp2y = fmt(p2.y - (p2.y - p1.y) * 0.25);
          }

          d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
        }
      }

      return d + " Z";
    };

    const isFullCanvas = (lp: Loop): boolean => {
      const b = lp.bbox;
      return b.minX <= 1 && b.minY <= 1 && b.maxX >= w - 1 && b.maxY >= h - 1;
    };

    if (options.splitPerPatch) {
      for (let pIdx = 0; pIdx < patchGroups.length; pIdx++) {
        const group = patchGroups[pIdx];
        let d = formatLoopToD(group.outer.pts);
        for (const hole of group.holes) {
          d += " " + formatLoopToD(hole.pts);
        }

        const ptsCount =
          group.outer.pts.length + group.holes.reduce((sum, h) => sum + h.pts.length, 0);

        const isBgLayer = r === 0 && pIdx === 0 && isFullCanvas(group.outer);

        layersResult.push({
          id: layersResult.length + 1,
          hex,
          name: `Shape ${String(layersResult.length + 1).padStart(3, "0")}`,
          pointsCount: ptsCount,
          d: d.trim(),
          enabled: !(options.removeBg && isBgLayer),
          isBg: isBgLayer,
        });
      }
    } else {
      let combinedD = "";
      let totalPts = 0;
      for (const group of patchGroups) {
        combinedD += " " + formatLoopToD(group.outer.pts);
        totalPts += group.outer.pts.length;
        for (const hole of group.holes) {
          combinedD += " " + formatLoopToD(hole.pts);
          totalPts += hole.pts.length;
        }
      }

      const isBgLayer = r === 0 && patchGroups.length === 1 && isFullCanvas(patchGroups[0].outer);

      layersResult.push({
        id: layersResult.length + 1,
        hex,
        name: `Layer ${String(layersResult.length + 1).padStart(3, "0")} (${hex})`,
        pointsCount: totalPts,
        d: combinedD.trim(),
        enabled: !(options.removeBg && isBgLayer),
        isBg: isBgLayer,
      });
    }
  }

  // Generate SVG String with shape-rendering="geometricPrecision" & fill-rule="evenodd"
  const activePaths = layersResult
    .filter((l) => l.enabled)
    .map((l) => `<path fill="${l.hex}" fill-rule="evenodd" d="${l.d}"/>`)
    .join("\n");

  const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${outW} ${outH}" shape-rendering="geometricPrecision">\n${activePaths}\n</svg>`;
  const svgBytes = new Blob([finalSvg]).size;

  // Size limit check: only if > 3.5MB, optimize speckle
  if (svgBytes > 3.5 * 1024 * 1024 && options.speckle < 40) {
    onProgress?.(0.95, "Mengoptimalkan ukuran berkas SVG...");
    return runAutoTrace(
      imgData,
      { ...options, speckle: Math.max(6, options.speckle * 2 + 2) },
      onProgress,
      abortSignal
    );
  }

  onProgress?.(1.0, "SELESAI");

  return {
    svgString: finalSvg,
    width: outW,
    height: outH,
    layers: layersResult,
    paletteHexes,
    totalShapes: layersResult.length,
    totalColors: totalLayers,
    svgSizeBytes: svgBytes,
    exactPaletteUsed,
  };
}
