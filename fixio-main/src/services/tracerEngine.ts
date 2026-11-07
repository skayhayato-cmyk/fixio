/**
 * Auto Trace Engine - Converts raster images (PNG/JPG/WebP) to multi-layered, patch-separated SVG vectors.
 * Implements K-Means quantization, Edge-Fringe cleaning, Marching Squares contouring,
 * Douglas-Peucker polygon simplification, Hole-parent matching, and Catmull-Rom to Bezier curve smoothing.
 */

export type TraceMode = "standard" | "lineart" | "silhouette" | "manga3";

export interface TraceOptions {
  mode?: TraceMode; // "standard" | "lineart" | "silhouette" | "manga3"
  colors: number; // 2 - 24
  resolution: number; // 320, 480, 640, 800
  speckle: number; // 0 - 200 px²
  smoothness: number; // 0: Sharp, 1: Smooth, 2: Ultra smooth
  splitPerPatch: boolean; // true: 1 path per patch, false: 1 path per layer
  cleanEdges: boolean; // mergeSimilar & cleanFringe
  removeBg: boolean; // Remove rank 0 canvas background layer
  transparentPaper?: boolean; // Hapus kertas putih otomatis (hanya garis tinta & arsir)
  lineSensitivity?: number; // 0 - 100: sensitivitas garis tinta manga (default 50)
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
  totalShapes: number;
  totalColors: number;
  svgSizeBytes: number;
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
 * 5.1 Load and scale image to target maximum resolution
 */
export async function loadAndScaleImage(
  source: File | Blob | string,
  targetMaxDim: number
): Promise<{ imageData: ImageData; width: number; height: number }> {
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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imgBitmap, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  return { imageData: imgData, width: w, height: h };
}

/**
 * Color distance squared in RGB space
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
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Douglas-Peucker polygon simplification for closed loops
 */
function simplifyClosedLoop(pts: Point[], epsilon: number): Point[] {
  if (pts.length <= 3) return pts;

  // Find farthest point from pts[0]
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

  const simplifySection = (start: number, end: number): Point[] => {
    let dMax = 0;
    let idx = start;
    const p1 = pts[start];
    const p2 = pts[end];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    for (let i = start + 1; i < end; i++) {
      let d = 0;
      if (lenSq === 0) {
        const ddx = pts[i].x - p1.x;
        const ddy = pts[i].y - p1.y;
        d = Math.sqrt(ddx * ddx + ddy * ddy);
      } else {
        const u = ((pts[i].x - p1.x) * dx + (pts[i].y - p1.y) * dy) / lenSq;
        const clampedU = Math.max(0, Math.min(1, u));
        const projX = p1.x + clampedU * dx;
        const projY = p1.y + clampedU * dy;
        const ddx = pts[i].x - projX;
        const ddy = pts[i].y - projY;
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
  const part2 = simplifySection(farIdx, pts.length - 1);
  const merged = part1.slice(0, -1).concat(part2);
  return merged.length >= 3 ? merged : pts;
}

/**
 * Main Auto Trace Execution Engine (Step 5.1 to 5.14)
 */
export async function runAutoTrace(
  imgData: ImageData,
  options: TraceOptions,
  onProgress?: TraceProgressCallback,
  abortSignal?: { aborted: boolean }
): Promise<TraceResult> {
  const { width: w, height: h, data } = imgData;
  const N = w * h;

  // Check abort
  if (abortSignal?.aborted) throw new Error("Proses dibatalkan.");
  onProgress?.(0.05, "Mengekstrak palet warna K-Means...");

  // 5.1 Alpha filtering: Pixels with alpha < 128 are treated as empty (-1)
  const opaqueIndices: number[] = [];
  for (let i = 0; i < N; i++) {
    if (data[i * 4 + 3] >= 128) {
      opaqueIndices.push(i);
    }
  }

  if (opaqueIndices.length === 0) {
    throw new Error("Gambar kosong atau transparan penuh.");
  }

  // 5.2 Palette generation: Smart Manga/Line-Art mode or general K-Means
  const isMangaMode = options.mode === "lineart" || options.mode === "manga3" || options.mode === "silhouette";
  const sens = Math.max(0, Math.min(100, options.lineSensitivity ?? 50));
  const transparentPaper = options.transparentPaper !== false;
  const paperThreshold = Math.max(160, Math.min(252, 230 - (sens - 50) * 0.7));

  const palette: [number, number, number][] = [];
  const pixelIdx = new Int16Array(N);
  pixelIdx.fill(-1);

  if (isMangaMode) {
    onProgress?.(0.08, "Mengoptimalkan garis tinta & arsir manga...");
    // Specialized high-contrast Manga / Line Art quantization
    if (options.mode === "silhouette") {
      palette.push([10, 10, 10]); // Pure Jet Black Ink
      if (!transparentPaper) palette.push([255, 255, 255]); // Paper White

      for (const idx of opaqueIndices) {
        let r = data[idx * 4];
        let g = data[idx * 4 + 1];
        let b = data[idx * 4 + 2];
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
      palette.push([10, 10, 10]); // Deep Black Ink
      palette.push([90, 90, 90]); // Shading / Cross-hatching Gray
      if (!transparentPaper) palette.push([255, 255, 255]); // Paper White

      const darkThresh = Math.max(35, Math.min(150, 90 + (sens - 50) * 0.7));
      for (const idx of opaqueIndices) {
        let r = data[idx * 4];
        let g = data[idx * 4 + 1];
        let b = data[idx * 4 + 2];
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
      // "lineart" - Manga Sketch with fine ink & hatching gradations
      palette.push([10, 10, 10]); // Tinta Pekat / Kontur Utama
      palette.push([65, 65, 65]); // Arsir Gelap / Bayangan Mata
      palette.push([125, 125, 125]); // Arsir Halus / Tekstur Pensil
      if (options.colors >= 4) {
        palette.push([175, 175, 175]); // Tone Lembut
      }
      if (!transparentPaper) palette.push([255, 255, 255]); // Kertas Putih

      const numInkLevels = options.colors >= 4 ? 4 : 3;
      const stepLum = paperThreshold / numInkLevels;

      for (const idx of opaqueIndices) {
        let r = data[idx * 4];
        let g = data[idx * 4 + 1];
        let b = data[idx * 4 + 2];
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
    // 5.2 General Palette (k-means) with farthest-point initialization
    const K = Math.max(2, Math.min(24, options.colors));
    const step = Math.max(1, Math.floor(opaqueIndices.length / 20000));
    const samplePixels: [number, number, number][] = [];
    for (let i = 0; i < opaqueIndices.length; i += step) {
      const idx = opaqueIndices[i];
      samplePixels.push([data[idx * 4], data[idx * 4 + 1], data[idx * 4 + 2]]);
    }

    // Farthest-point initialization
    if (samplePixels.length > 0) {
      palette.push(samplePixels[0]);
      while (palette.length < K && palette.length < samplePixels.length) {
        let maxDist = -1;
        let bestSample = samplePixels[0];
        for (const [r, g, b] of samplePixels) {
          let minDistToPal = Infinity;
          for (const [pr, pg, pb] of palette) {
            const d = distSq(r, g, b, pr, pg, pb);
            if (d < minDistToPal) minDistToPal = d;
          }
          if (minDistToPal > maxDist) {
            maxDist = minDistToPal;
            bestSample = [r, g, b];
          }
        }
        if (maxDist < 16) break;
        palette.push(bestSample);
      }
    }

    // 8 Iterations of K-Means
    for (let iter = 0; iter < 8; iter++) {
      const sums = palette.map(() => [0, 0, 0, 0]); // [rSum, gSum, bSum, count]
      for (const [r, g, b] of samplePixels) {
        let bestPal = 0;
        let bestDist = Infinity;
        for (let p = 0; p < palette.length; p++) {
          const d = distSq(r, g, b, palette[p][0], palette[p][1], palette[p][2]);
          if (d < bestDist) {
            bestDist = d;
            bestPal = p;
          }
        }
        sums[bestPal][0] += r;
        sums[bestPal][1] += g;
        sums[bestPal][2] += b;
        sums[bestPal][3]++;
      }
      for (let p = 0; p < palette.length; p++) {
        if (sums[p][3] > 0) {
          palette[p] = [
            Math.round(sums[p][0] / sums[p][3]),
            Math.round(sums[p][1] / sums[p][3]),
            Math.round(sums[p][2] / sums[p][3]),
          ];
        }
      }
    }

    // 5.3 Pixel Labeling
    for (const idx of opaqueIndices) {
      const r = data[idx * 4];
      const g = data[idx * 4 + 1];
      const b = data[idx * 4 + 2];
      let bestP = 0;
      let bestDist = Infinity;
      for (let p = 0; p < palette.length; p++) {
        const d = distSq(r, g, b, palette[p][0], palette[p][1], palette[p][2]);
        if (d < bestDist) {
          bestDist = d;
          bestP = p;
        }
      }
      pixelIdx[idx] = bestP;
    }
  }

  // 5.4 Edge Cleaning (mergeSimilar & cleanFringe) if tClean ON
  if (options.cleanEdges) {
    onProgress?.(0.12, "Merapikan tepi dan anti-alias...");
    // mergeSimilar(T = 56)
    const counts = new Int32Array(palette.length);
    for (let i = 0; i < N; i++) {
      if (pixelIdx[i] >= 0) counts[pixelIdx[i]]++;
    }

    const palOrder = Array.from({ length: palette.length }, (_, i) => i).sort(
      (a, b) => counts[a] - counts[b]
    );

    const mergedTo = new Int16Array(palette.length);
    for (let i = 0; i < palette.length; i++) mergedTo[i] = i;

    for (const c of palOrder) {
      if (counts[c] === 0) continue;
      let targetColor = -1;
      let minD = 56 * 56;
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

    // cleanFringe up to 8 passes
    for (let pass = 0; pass < 8; pass++) {
      const curCounts = new Int32Array(palette.length);
      const thinCounts = new Int32Array(palette.length);
      const neighbors = Array.from({ length: palette.length }, () => new Map<number, number>());

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const c = pixelIdx[idx];
          if (c < 0) continue;
          curCounts[c]++;

          // 3x3 block test
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

          // Neighbor count (right & bottom)
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
        // In manga mode, protect primary jet black ink from being dissolved
        if (isMangaMode && c === 0) continue;
        if (thinCounts[c] >= 0.6 * curCounts[c] && neighbors[c].size >= 2) {
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
              if (t >= 0.05 && t <= 0.95) {
                const proj = [pA[0] + t * vAB[0], pA[1] + t * vAB[1], pA[2] + t * vAB[2]];
                const dLine = Math.sqrt(
                  distSq(pC[0], pC[1], pC[2], proj[0], proj[1], proj[2])
                );
                if (dLine < 48) {
                  transitionColor = c;
                  break;
                }
              }
            }
          }
        }
      }

      if (transitionColor < 0) break;

      // Reassign transitionColor pixels to closest 8-way neighbor
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
                    const d = distSq(r, g, b, palette[nc][0], palette[nc][1], palette[nc][2]);
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

  // 5.5 Stacked Layer Order: Count pixels per color, sort largest first
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

  // Rank map: color index -> rank index (0 = largest/bottom)
  const colorRank = new Int16Array(palette.length);
  colorRank.fill(-1);
  activeColors.forEach((colorIdx, rank) => {
    colorRank[colorIdx] = rank;
  });

  const totalLayers = activeColors.length;
  const layersResult: TraceLayerInfo[] = [];
  const sc = OUT_SIZE / Math.max(w, h);
  const outW = Math.round(w * sc);
  const outH = Math.round(h * sc);

  // Douglas-Peucker Epsilon based on smoothness
  const eps = options.smoothness === 0 ? 0.35 : options.smoothness === 1 ? 0.6 : 0.9;
  const factor = options.smoothness === 1 ? 0.3 : 0.4;
  const cosCornerThresh = options.smoothness === 1 ? 0.1 : -0.3;

  // Process layer by layer asynchronously
  for (let r = 0; r < totalLayers; r++) {
    if (abortSignal?.aborted) throw new Error("Proses dibatalkan.");
    const progress = 0.2 + (r / totalLayers) * 0.75;
    onProgress?.(progress, `Membuat kontur layer ${r + 1} dari ${totalLayers}...`);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const colorIdx = activeColors[r];
    const hex = rgbToHex(palette[colorIdx][0], palette[colorIdx][1], palette[colorIdx][2]);

    // 5.6 Scalar field: (w+4) x (h+4) with 2px edge-replication padding
    const padW = w + 4;
    const padH = h + 4;
    const field = new Float32Array(padW * padH);

    for (let py = 0; py < padH; py++) {
      const iy = Math.max(0, Math.min(h - 1, py - 2));
      for (let px = 0; px < padW; px++) {
        const ix = Math.max(0, Math.min(w - 1, px - 2));
        const pIdx = pixelIdx[iy * w + ix];
        // Stacked: layer rank r contains all pixels with rank >= r
        field[py * padW + px] = pIdx >= 0 && colorRank[pIdx] >= r ? 1.0 : 0.0;
      }
    }

    // 3x3 Box Blur if Smoothness > 0
    if (options.smoothness > 0) {
      const blurred = new Float32Array(padW * padH);
      for (let py = 1; py < padH - 1; py++) {
        for (let px = 1; px < padW - 1; px++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += field[(py + dy) * padW + (px + dx)];
            }
          }
          blurred[py * padW + px] = sum / 9.0;
        }
      }
      field.set(blurred);
    }

    // Marching Squares with 0.5 threshold and linear interpolation
    // Edge IDs: 0: Top, 1: Right, 2: Bottom, 3: Left
    interface EdgeSegment {
      fromKey: string;
      toKey: string;
      p1: Point;
      p2: Point;
    }

    const segments: EdgeSegment[] = [];

    const getEdgePoint = (x: number, y: number, edge: number): Point => {
      // Cell top-left is (x, y), vertices: v0=(x,y), v1=(x+1,y), v2=(x+1,y+1), v3=(x,y+1)
      const v0 = field[y * padW + x];
      const v1 = field[y * padW + (x + 1)];
      const v2 = field[(y + 1) * padW + (x + 1)];
      const v3 = field[(y + 1) * padW + x];

      if (edge === 0) {
        // Top edge: v0 -> v1
        const u = (0.5 - v0) / (v1 - v0 + 1e-12);
        return { x: x + u, y };
      } else if (edge === 1) {
        // Right edge: v1 -> v2
        const u = (0.5 - v1) / (v2 - v1 + 1e-12);
        return { x: x + 1, y: y + u };
      } else if (edge === 2) {
        // Bottom edge: v3 -> v2
        const u = (0.5 - v3) / (v2 - v3 + 1e-12);
        return { x: x + u, y: y + 1 };
      } else {
        // Left edge: v0 -> v3
        const u = (0.5 - v0) / (v3 - v0 + 1e-12);
        return { x, y: y + u };
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
        const v0 = field[cy * padW + cx] >= 0.5 ? 1 : 0;
        const v1 = field[cy * padW + (cx + 1)] >= 0.5 ? 2 : 0;
        const v2 = field[(cy + 1) * padW + (cx + 1)] >= 0.5 ? 4 : 0;
        const v3 = field[(cy + 1) * padW + cx] >= 0.5 ? 8 : 0;
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

        // Consistent right-hand rule (fill on the right)
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
          case 5: // Saddle
            if (field[cy * padW + cx] >= 0.5) {
              addSeg(3, 0);
              addSeg(1, 2);
            } else {
              addSeg(0, 1);
              addSeg(3, 2);
            }
            break;
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
          case 10: // Saddle
            if (field[cy * padW + cx] >= 0.5) {
              addSeg(0, 3);
              addSeg(2, 1);
            } else {
              addSeg(0, 1);
              addSeg(2, 3);
            }
            break;
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

    // Stitch segments into closed loops using Map
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
          // Closed loop complete
          break;
        }
        cur = next;
        steps++;
      }

      if (loopPts.length >= 3) {
        rawLoops.push(loopPts);
      }
    }

    // 5.7 Coordinates offset (-1.5) & clamp to [0, w] x [0, h]
    // 5.8 Noise filtering (Shoelace area |area| < tSpeck)
    // 5.9 Douglas-Peucker simplification
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

    // 5.10 Split per patch (core feature)
    // Find largest loop area to determine outer loop sign
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

    // Attach each hole to the smallest enclosing outer loop
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
        // Bounding box check
        if (hb.minX >= ob.minX && hb.maxX <= ob.maxX && hb.minY >= ob.minY && hb.maxY <= ob.maxY) {
          // Point in polygon check
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

    // Sort patch groups by area descending
    patchGroups.sort((a, b) => b.area - a.area);

    // 5.11 Path string formatting
    const formatLoopToD = (pts: Point[]): string => {
      const n = pts.length;
      if (n === 0) return "";

      const scaledPts = pts.map((p) => ({
        x: Number((p.x * sc).toFixed(1)),
        y: Number((p.y * sc).toFixed(1)),
      }));

      if (options.smoothness === 0) {
        let d = `M ${scaledPts[0].x} ${scaledPts[0].y}`;
        for (let i = 1; i < n; i++) {
          d += ` L ${scaledPts[i].x} ${scaledPts[i].y}`;
        }
        return d + " Z";
      }

      // Catmull-Rom to Cubic Bezier with sharp corner preservation
      const isCorner = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const prev = scaledPts[(i - 1 + n) % n];
        const cur = scaledPts[i];
        const next = scaledPts[(i + 1) % n];

        const v1x = cur.x - prev.x;
        const v1y = cur.y - prev.y;
        const v2x = next.x - cur.x;
        const v2y = next.y - cur.y;
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

        if (len1 > 0 && len2 > 0) {
          const cosA = (v1x * v2x + v1y * v2y) / (len1 * len2);
          if (cosA < cosCornerThresh) {
            isCorner[i] = 1;
          }
        }
      }

      // Compute tangents
      const tangents: Point[] = [];
      for (let i = 0; i < n; i++) {
        const prev = scaledPts[(i - 1 + n) % n];
        const next = scaledPts[(i + 1) % n];
        const tx = next.x - prev.x;
        const ty = next.y - prev.y;
        const len = Math.sqrt(tx * tx + ty * ty);
        tangents.push(len > 0 ? { x: tx / len, y: ty / len } : { x: 0, y: 0 });
      }

      let d = `M ${scaledPts[0].x} ${scaledPts[0].y}`;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const p1 = scaledPts[i];
        const p2 = scaledPts[j];
        const segLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

        if (isCorner[i] && isCorner[j]) {
          d += ` L ${p2.x} ${p2.y}`;
        } else {
          const hLen = segLen * factor;
          const cp1x = Number((p1.x + tangents[i].x * hLen).toFixed(1));
          const cp1y = Number((p1.y + tangents[i].y * hLen).toFixed(1));
          const cp2x = Number((p2.x - tangents[j].x * hLen).toFixed(1));
          const cp2y = Number((p2.y - tangents[j].y * hLen).toFixed(1));
          d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
        }
      }

      return d + " Z";
    };

    // Check if rank 0 is a full canvas box for optional 5.14 removeBg
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

  // Generate SVG String
  const activePaths = layersResult
    .filter((l) => l.enabled)
    .map((l) => `<path fill="${l.hex}" d="${l.d}"/>`)
    .join("\n");

  const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${outW} ${outH}">\n${activePaths}\n</svg>`;
  const svgBytes = new Blob([finalSvg]).size;

  // 5.13 Size limit check: If > 1.9MB, auto-retry with higher speckle
  if (svgBytes > 1.9 * 1024 * 1024 && options.speckle < 60) {
    onProgress?.(0.95, "Mengoptimalkan ukuran berkas SVG...");
    return runAutoTrace(
      imgData,
      { ...options, speckle: Math.max(8, options.speckle * 3) },
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
    totalShapes: layersResult.length,
    totalColors: totalLayers,
    svgSizeBytes: svgBytes,
  };
}
