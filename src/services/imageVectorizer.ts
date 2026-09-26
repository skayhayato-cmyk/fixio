import ImageTracer, { ImageTracerOptions } from 'imagetracerjs';

export type VectorizerPresetKey = 'default' | 'photo' | 'clipart' | 'monochrome' | 'poster' | 'minimal';

export interface VectorizerPreset {
  id: VectorizerPresetKey;
  name: string;
  description: string;
  options: Partial<VectorizerOptions>;
}

export interface VectorizerOptions {
  preset: VectorizerPresetKey;
  numberOfColors: number;
  colorSampling: number; // 0 = disabled, 1 = random, 2 = deterministic
  blurRadius: number;
  pathOmit: number; // Noise / speckle filter (path size limit)
  lineThreshold: number;
  quadThreshold: number;
  scale: number;
  roundCoords: number;
  removeBackground: boolean;
  monochrome: boolean;
  strokeWidth: number;
  maxDimension: number; // Max canvas dimension (e.g. 1024px) for performance
}

export const VECTORIZER_PRESETS: VectorizerPreset[] = [
  {
    id: 'default',
    name: 'Auto-Trace Standar',
    description: 'Keseimbangan terbaik antara detail, warna, dan kehalusan garis vektor.',
    options: {
      numberOfColors: 16,
      blurRadius: 0,
      pathOmit: 8,
      lineThreshold: 1,
      quadThreshold: 1,
      monochrome: false,
      removeBackground: false,
    },
  },
  {
    id: 'photo',
    name: 'High Detail Photo',
    description: 'Mempertahankan gradasi warna halus dan detail gambar fotografi.',
    options: {
      numberOfColors: 32,
      blurRadius: 0,
      pathOmit: 4,
      lineThreshold: 0.5,
      quadThreshold: 0.5,
      monochrome: false,
      removeBackground: false,
    },
  },
  {
    id: 'clipart',
    name: 'Clipart & Vektor Grafis',
    description: 'Sangat cocok untuk ilustrasi, stiker, atau gambar kartun dengan warna padat.',
    options: {
      numberOfColors: 8,
      blurRadius: 1,
      pathOmit: 16,
      lineThreshold: 1.5,
      quadThreshold: 1.5,
      monochrome: false,
      removeBackground: false,
    },
  },
  {
    id: 'monochrome',
    name: 'Line Art / Hitam Putih',
    description: 'Konversi logo, sketsa, dan tanda tangan menjadi vektor 2 warna (Monokrom).',
    options: {
      numberOfColors: 2,
      blurRadius: 0,
      pathOmit: 8,
      lineThreshold: 1,
      quadThreshold: 1,
      monochrome: true,
      removeBackground: true,
    },
  },
  {
    id: 'poster',
    name: 'Flat Poster / Pop Art',
    description: 'Gaya poster retro dengan blok warna terbatas & artistik.',
    options: {
      numberOfColors: 6,
      blurRadius: 2,
      pathOmit: 20,
      lineThreshold: 2,
      quadThreshold: 2,
      monochrome: false,
      removeBackground: false,
    },
  },
  {
    id: 'minimal',
    name: 'Logo Minimalis',
    description: 'Garis sederhana & jumlah kurva sedikit untuk pembuatan logo.',
    options: {
      numberOfColors: 4,
      blurRadius: 1,
      pathOmit: 25,
      lineThreshold: 2.5,
      quadThreshold: 2.5,
      monochrome: false,
      removeBackground: false,
    },
  },
];

export const DEFAULT_VECTORIZER_OPTIONS: VectorizerOptions = {
  preset: 'default',
  numberOfColors: 16,
  colorSampling: 2,
  blurRadius: 0,
  pathOmit: 8,
  lineThreshold: 1,
  quadThreshold: 1,
  scale: 1,
  roundCoords: 1,
  removeBackground: false,
  monochrome: false,
  strokeWidth: 0,
  maxDimension: 1200,
};

/**
 * Loads image onto an offscreen canvas and extracts ImageData
 */
async function getImageDataFromUrl(
  imageUrl: string,
  maxDimension: number = 1200
): Promise<{ imageData: ImageData; originalWidth: number; originalHeight: number; scaledWidth: number; scaledHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const originalWidth = width;
        const originalHeight = height;

        // Downscale if image is larger than maxDimension for tracing performance
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal menginisialisasi Canvas Context 2D.'));
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        resolve({
          imageData,
          originalWidth,
          originalHeight,
          scaledWidth: width,
          scaledHeight: height,
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses piksel gambar: ${err.message || 'CORS Restriction'}`));
      }
    };

    img.onerror = () => {
      // Fallback attempt: if CORS issue, fetch image as blob or via proxy
      fetchImageAsBlobData(imageUrl, maxDimension)
        .then(resolve)
        .catch(() => reject(new Error('Gagal memuat gambar. Pastikan URL valid dan dapat diakses.')));
    };

    img.src = imageUrl;
  });
}

/**
 * Fallback to fetch image via fetch API and create Blob object URL
 */
async function fetchImageAsBlobData(
  imageUrl: string,
  maxDimension: number
): Promise<{ imageData: ImageData; originalWidth: number; originalHeight: number; scaledWidth: number; scaledHeight: number }> {
  const response = await fetch(imageUrl, { mode: 'cors' });
  if (!response.ok) throw new Error('Network error fetching image');
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const originalWidth = width;
      const originalHeight = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Canvas context failure'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      URL.revokeObjectURL(blobUrl);

      resolve({
        imageData,
        originalWidth,
        originalHeight,
        scaledWidth: width,
        scaledHeight: height,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Blob image load error'));
    };
    img.src = blobUrl;
  });
}

/**
 * Perform monochrome transformation or background removal on ImageData before tracing if needed
 */
function preprocessImageData(imageData: ImageData, options: VectorizerOptions): ImageData {
  if (!options.monochrome && !options.removeBackground) {
    return imageData;
  }

  const { width, height, data } = imageData;
  const newImgData = new ImageData(new Uint8ClampedArray(data), width, height);
  const buf = newImgData.data;

  if (options.monochrome) {
    // Convert to high contrast black and white
    for (let i = 0; i < buf.length; i += 4) {
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      const alpha = buf[i + 3];

      if (alpha < 10) continue;

      // Luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const bw = gray > 128 ? 255 : 0;

      buf[i] = bw;
      buf[i + 1] = bw;
      buf[i + 2] = bw;
    }
  }

  return newImgData;
}

export interface VectorizeResult {
  svgCode: string;
  svgDataUrl: string;
  pathCount: number;
  fileSizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  tracedWidth: number;
  tracedHeight: number;
  colorsUsed: number;
}

/**
 * Main function: Vectorize raster image URL to SVG string with full customization
 */
export async function vectorizeImage(
  imageUrl: string,
  options: VectorizerOptions
): Promise<VectorizeResult> {
  const { imageData, originalWidth, originalHeight, scaledWidth, scaledHeight } = await getImageDataFromUrl(
    imageUrl,
    options.maxDimension
  );

  const processedData = preprocessImageData(imageData, options);

  // Configure ImageTracerJS options
  const tracerOptions: ImageTracerOptions = {
    corsenabled: true,
    ltres: options.lineThreshold,
    qtres: options.quadThreshold,
    pathomit: options.pathOmit,
    colorsampling: options.colorSampling,
    numberofcolors: options.monochrome ? 2 : options.numberOfColors,
    blurradius: options.blurRadius,
    scale: options.scale,
    roundcoords: options.roundCoords,
    strokewidth: options.strokeWidth,
    viewbox: true,
    desc: false,
    rightangleenhance: true,
  };

  let rawSvg: string = '';

  try {
    if (ImageTracer.imagedataToSVG) {
      rawSvg = ImageTracer.imagedataToSVG(processedData, tracerOptions);
    } else if (typeof ImageTracer === 'function') {
      rawSvg = (ImageTracer as any).imagedataToSVG(processedData, tracerOptions);
    } else {
      // Direct call fallback
      rawSvg = ImageTracer.imageDataToSVG(processedData, tracerOptions);
    }
  } catch (err: any) {
    throw new Error(`Gagal melakukan tracing vektor: ${err.message || 'Tracing algorithm error'}`);
  }

  if (!rawSvg || !rawSvg.includes('<svg')) {
    throw new Error('Hasil vektor SVG tidak valid.');
  }

  // Remove white background paths if removeBackground option is enabled
  let finalSvg = rawSvg;
  if (options.removeBackground || options.monochrome) {
    // Optionally sanitize or strip background fill rects / white paths
    finalSvg = finalSvg.replace(/<path[^>]*fill="rgb\(255,255,255\)"[^>]*\/>/gi, '');
    finalSvg = finalSvg.replace(/<path[^>]*fill="#ffffff"[^>]*\/>/gi, '');
    finalSvg = finalSvg.replace(/<path[^>]*fill="white"[^>]*\/>/gi, '');
  }

  // Calculate stats
  const pathMatches = finalSvg.match(/<path/g);
  const pathCount = pathMatches ? pathMatches.length : 0;
  const fileSizeBytes = new Blob([finalSvg], { type: 'image/svg+xml' }).size;

  // Extract color count from SVG fill occurrences
  const fills = new Set(finalSvg.match(/fill="[^"]+"/g) || []);
  const colorsUsed = fills.size;

  const encodedSvg = encodeURIComponent(finalSvg);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  return {
    svgCode: finalSvg,
    svgDataUrl,
    pathCount,
    fileSizeBytes,
    originalWidth,
    originalHeight,
    tracedWidth: scaledWidth,
    tracedHeight: scaledHeight,
    colorsUsed,
  };
}
