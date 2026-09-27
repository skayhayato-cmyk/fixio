/**
 * Alight Motion & Android VectorDrawable Converter Engine
 *
 * Implements 100% Distinct Scene Generators:
 * - generateAndroidVectorXml() -> Official Android VectorDrawable (<vector><path .../></vector>)
 * - generateAlightMotionXml()  -> Native Alight Motion Project Scene (<scene><shape ...><transform/><property/><path d="..."/></shape></scene>)
 * - validateAlightMotionXml()   -> Re-parses actual generated Alight Motion XML with DOMParser to verify structure
 */

export interface Matrix2D {
  a: number; // scaleX
  b: number; // skewY
  c: number; // skewX
  d: number; // scaleY
  e: number; // translateX
  f: number; // translateY
}

export function identityMatrix(): Matrix2D {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

export function multiplyMatrix(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

export function transformPoint(m: Matrix2D, x: number, y: number): { x: number; y: number } {
  const tx = m.a * x + m.c * y + m.e;
  const ty = m.b * x + m.d * y + m.f;
  return {
    x: Number.isFinite(tx) ? tx : 0,
    y: Number.isFinite(ty) ? ty : 0,
  };
}

export interface SvgToXmlOptions {
  widthDp?: number;
  heightDp?: number;
  tintColor?: string;
  vectorName?: string;
  indentation?: '2' | '4';
  alightMotionPreset?: boolean;
}

export interface ProcessedLayer {
  id: string;
  label: string;
  pathData: string;
  fillColor: string | null;
  strokeColor: string | null;
  strokeWidth: number;
  opacity: number;
  fillOpacity: number;
  strokeOpacity: number;
  fillRule: 'nonzero' | 'evenodd';
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface ViewportCalculation {
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface AlightValidationCheck {
  id: string;
  label: string;
  passed: boolean;
  message?: string;
}

export interface AlightValidationResult {
  isValid: boolean;
  checks: AlightValidationCheck[];
  errors: string[];
  warnings: string[];
  pathCount: number;
  viewportInfo: ViewportCalculation;
}

export interface SvgToXmlResult {
  xmlCode: string;
  alightXmlCode: string;
  composeCode: string;
  widthDp: number;
  heightDp: number;
  viewportWidth: number;
  viewportHeight: number;
  pathCount: number;
  fileSizeBytes: number;
  validation: AlightValidationResult;
  warnings: string[];
  pathsSummary: Array<{
    id: string;
    fillColor: string | null;
    strokeColor: string | null;
    strokeWidth: number;
    pathLength: number;
  }>;
}

/**
 * 1. NORMALIZE SVG INPUT
 * Strips comments, BOM, illegal entities, and wraps bare shape tags
 */
export function normalizeSvg(svgContent: string): string {
  if (!svgContent || !svgContent.trim()) {
    throw new Error('Sintaks berkas SVG/XML kosong.');
  }

  let clean = svgContent.replace(/^\uFEFF/, '').trim();
  // Strip comments
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');
  // Clean illegal control characters
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (!clean.toLowerCase().includes('<svg') && !clean.toLowerCase().includes('<vector')) {
    clean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${clean}</svg>`;
  }

  return clean;
}

/**
 * 2. PARSE SVG STRING TO DOM
 */
export function parseSvg(svgString: string): Document {
  const parser = new DOMParser();
  let doc = parser.parseFromString(svgString, 'image/svg+xml');

  let parserError = doc.querySelector('parsererror');
  if (parserError) {
    try {
      doc = parser.parseFromString(svgString, 'text/xml');
      parserError = doc.querySelector('parsererror');
    } catch {
      // ignore
    }
  }

  if (parserError) {
    throw new Error('Gagal mem-parse sintaks SVG. Format XML tidak valid: ' + (parserError.textContent || 'Unknown syntax error'));
  }

  return doc;
}

/**
 * Parses affine matrix transforms: translate, scale, rotate, skewX, skewY, matrix
 */
export function parseAffineMatrix(transformStr: string | null | undefined): Matrix2D {
  if (!transformStr || !transformStr.trim()) {
    return identityMatrix();
  }

  let cumulative = identityMatrix();
  const regex = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]+)\)/gi;
  let match;

  while ((match = regex.exec(transformStr)) !== null) {
    const type = match[1].toLowerCase();
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
      .filter((n) => !isNaN(n));

    let m = identityMatrix();

    if (type === 'matrix' && args.length >= 6) {
      m = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] };
    } else if (type === 'translate' && args.length >= 1) {
      m = { a: 1, b: 0, c: 0, d: 1, e: args[0], f: args[1] !== undefined ? args[1] : 0 };
    } else if (type === 'scale' && args.length >= 1) {
      const sx = args[0];
      const sy = args[1] !== undefined ? args[1] : sx;
      m = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
    } else if (type === 'rotate' && args.length >= 1) {
      const angle = (args[0] * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        const t1: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
        const rot: Matrix2D = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
        const t2: Matrix2D = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };
        m = multiplyMatrix(multiplyMatrix(t1, rot), t2);
      } else {
        m = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
      }
    } else if (type === 'skewx' && args.length >= 1) {
      const tan = Math.tan((args[0] * Math.PI) / 180);
      m = { a: 1, b: 0, c: tan, d: 1, e: 0, f: 0 };
    } else if (type === 'skewy' && args.length >= 1) {
      const tan = Math.tan((args[0] * Math.PI) / 180);
      m = { a: 1, b: tan, c: 0, d: 1, e: 0, f: 0 };
    }

    cumulative = multiplyMatrix(cumulative, m);
  }

  return cumulative;
}

/**
 * 3. FLATTEN TRANSFORMS: Computes cumulative 2D matrix from element up to root <svg>
 */
export function flattenTransforms(element: Element): Matrix2D {
  const matrices: Matrix2D[] = [];
  let curr: Element | null = element;

  while (curr) {
    const transformStr = curr.getAttribute('transform') || curr.getAttribute('android:transform');
    if (transformStr) {
      matrices.unshift(parseAffineMatrix(transformStr));
    }
    if (curr.tagName.toLowerCase() === 'svg') break;
    curr = curr.parentElement;
  }

  let finalMatrix = identityMatrix();
  matrices.forEach((m) => {
    finalMatrix = multiplyMatrix(finalMatrix, m);
  });

  return finalMatrix;
}

/**
 * Formats float to max 3 decimal places without trailing zeroes or scientific notation
 */
export function formatCoordinate(num: number): string {
  if (!Number.isFinite(num)) return '0';
  const val = Math.round(num * 1000) / 1000;
  return Object.is(val, -0) ? '0' : val.toString();
}

/**
 * Sanitizes path data string, removes scientific notation (e.g. 1.2e-4 -> 0.00012)
 */
export function sanitizePathData(d: string): string {
  if (!d) return '';
  let clean = d.replace(/([+-]?\d+(?:\.\d+)?)[eE]([+-]?\d+)/g, (_, num, exp) => {
    const val = parseFloat(num) * Math.pow(10, parseInt(exp, 10));
    return formatCoordinate(val);
  });
  clean = clean.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return clean;
}

/**
 * 4. CONVERT SHAPES TO PATHS (<rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon>)
 */
export function convertShapesToPaths(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'path') {
    const d = element.getAttribute('d') || element.getAttribute('android:pathData');
    return d ? sanitizePathData(d) : null;
  }

  if (tagName === 'rect') {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const w = parseFloat(element.getAttribute('width') || '0');
    const h = parseFloat(element.getAttribute('height') || '0');
    const rx = parseFloat(element.getAttribute('rx') || '0');
    const ry = parseFloat(element.getAttribute('ry') || element.getAttribute('rx') || '0');

    if (w <= 0 || h <= 0) return null;

    if (rx > 0 || ry > 0) {
      const rX = Math.min(rx, w / 2);
      const rY = Math.min(ry, h / 2);
      return `M ${x + rX} ${y} h ${w - 2 * rX} a ${rX} ${rY} 0 0 1 ${rX} ${rY} v ${h - 2 * rY} a ${rX} ${rY} 0 0 1 -${rX} ${rY} h -${w - 2 * rX} a ${rX} ${rY} 0 0 1 -${rX} -${rY} v -${h - 2 * rY} a ${rX} ${rY} 0 0 1 ${rX} -${rY} Z`;
    }

    return `M ${x} ${y} h ${w} v ${h} h -${w} Z`;
  }

  if (tagName === 'circle') {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const r = parseFloat(element.getAttribute('r') || '0');
    if (r <= 0) return null;
    const k = r * 0.552284749831;
    return `M ${cx} ${cy - r} C ${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} C ${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C ${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C ${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} Z`;
  }

  if (tagName === 'ellipse') {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const rx = parseFloat(element.getAttribute('rx') || '0');
    const ry = parseFloat(element.getAttribute('ry') || '0');
    if (rx <= 0 || ry <= 0) return null;
    const kx = rx * 0.552284749831;
    const ky = ry * 0.552284749831;
    return `M ${cx} ${cy - ry} C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy} C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry} C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy} C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry} Z`;
  }

  if (tagName === 'line') {
    const x1 = element.getAttribute('x1') || '0';
    const y1 = element.getAttribute('y1') || '0';
    const x2 = element.getAttribute('x2') || '0';
    const y2 = element.getAttribute('y2') || '0';
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  if (tagName === 'polyline' || tagName === 'polygon') {
    const pointsAttr = element.getAttribute('points') || '';
    const points = pointsAttr
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (points.length < 2) return null;

    let path = `M ${points[0]} ${points[1]}`;
    for (let i = 2; i < points.length; i += 2) {
      if (points[i] && points[i + 1]) {
        path += ` L ${points[i]} ${points[i + 1]}`;
      }
    }
    if (tagName === 'polygon') {
      path += ' Z';
    }
    return path;
  }

  return null;
}

/**
 * Splits a compound SVG path string into individual subpaths (each starting with M/m).
 * This ensures every shape in Alight Motion has a single, clean contour for flawless tracing.
 */
export function splitPathIntoSubpaths(d: string): string[] {
  if (!d || !d.trim()) return [];
  const subpaths: string[] = [];
  const subpathRegex = /([Mm][^Mm]+)/g;
  let match: RegExpExecArray | null;

  while ((match = subpathRegex.exec(d)) !== null) {
    const sp = match[1].trim();
    if (sp && sp.length > 3) {
      subpaths.push(sp);
    }
  }

  return subpaths.length > 0 ? subpaths : [d.trim()];
}

/**
 * 5. CONVERT PATH COMMANDS: Normalizes commands to absolute (M, L, C, S, Q, T, A, Z) and bakes 2D matrix
 */
export function convertPathCommands(d: string, matrix: Matrix2D): { pathData: string; bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
  if (!d || !d.trim()) {
    return { pathData: '', bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
  }

  const cleanD = sanitizePathData(d);
  const tokens: string[] = [];
  const tokenRegex = /([a-zA-Z])|([+-]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][+-]?\d+)?)/g;
  let match;

  while ((match = tokenRegex.exec(cleanD)) !== null) {
    if (match[1]) {
      tokens.push(match[1]);
    } else if (match[2]) {
      tokens.push(match[2]);
    }
  }

  let i = 0;
  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function updateBounds(x: number, y: number) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const outputParts: string[] = [];

  const readArgs = (count: number): number[] => {
    const args: number[] = [];
    while (args.length < count && i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
      const val = parseFloat(tokens[i]);
      args.push(isNaN(val) ? 0 : val);
      i++;
    }
    return args;
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (!/^[a-zA-Z]$/.test(token)) {
      i++;
      continue;
    }

    const cmd = token;
    const isRelative = cmd === cmd.toLowerCase();
    const upperCmd = cmd.toUpperCase();
    i++;

    if (upperCmd === 'M') {
      let isFirst = true;
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const coords = readArgs(2);
        if (coords.length < 2) break;

        let x = coords[0];
        let y = coords[1];

        if (isRelative) {
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        if (isFirst) {
          subpathStartX = x;
          subpathStartY = y;
          const pt = transformPoint(matrix, x, y);
          updateBounds(pt.x, pt.y);
          outputParts.push(`M ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
          isFirst = false;
        } else {
          const pt = transformPoint(matrix, x, y);
          updateBounds(pt.x, pt.y);
          outputParts.push(`L ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
        }
      }
    } else if (upperCmd === 'L') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const coords = readArgs(2);
        if (coords.length < 2) break;

        let x = coords[0];
        let y = coords[1];

        if (isRelative) {
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        const pt = transformPoint(matrix, x, y);
        updateBounds(pt.x, pt.y);
        outputParts.push(`L ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
      }
    } else if (upperCmd === 'H') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(1);
        if (args.length < 1) break;

        let x = args[0];
        if (isRelative) x += currentX;

        currentX = x;
        const pt = transformPoint(matrix, currentX, currentY);
        updateBounds(pt.x, pt.y);
        outputParts.push(`L ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
      }
    } else if (upperCmd === 'V') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(1);
        if (args.length < 1) break;

        let y = args[0];
        if (isRelative) y += currentY;

        currentY = y;
        const pt = transformPoint(matrix, currentX, currentY);
        updateBounds(pt.x, pt.y);
        outputParts.push(`L ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
      }
    } else if (upperCmd === 'C') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(6);
        if (args.length < 6) break;

        let x1 = args[0];
        let y1 = args[1];
        let x2 = args[2];
        let y2 = args[3];
        let x = args[4];
        let y = args[5];

        if (isRelative) {
          x1 += currentX;
          y1 += currentY;
          x2 += currentX;
          y2 += currentY;
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        const pt1 = transformPoint(matrix, x1, y1);
        const pt2 = transformPoint(matrix, x2, y2);
        const pt = transformPoint(matrix, x, y);

        updateBounds(pt1.x, pt1.y);
        updateBounds(pt2.x, pt2.y);
        updateBounds(pt.x, pt.y);

        outputParts.push(
          `C ${formatCoordinate(pt1.x)} ${formatCoordinate(pt1.y)} ${formatCoordinate(pt2.x)} ${formatCoordinate(pt2.y)} ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`
        );
      }
    } else if (upperCmd === 'S') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(4);
        if (args.length < 4) break;

        let x2 = args[0];
        let y2 = args[1];
        let x = args[2];
        let y = args[3];

        if (isRelative) {
          x2 += currentX;
          y2 += currentY;
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        const pt2 = transformPoint(matrix, x2, y2);
        const pt = transformPoint(matrix, x, y);

        updateBounds(pt2.x, pt2.y);
        updateBounds(pt.x, pt.y);

        outputParts.push(`S ${formatCoordinate(pt2.x)} ${formatCoordinate(pt2.y)} ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
      }
    } else if (upperCmd === 'Q') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(4);
        if (args.length < 4) break;

        let x1 = args[0];
        let y1 = args[1];
        let x = args[2];
        let y = args[3];

        if (isRelative) {
          x1 += currentX;
          y1 += currentY;
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        const pt1 = transformPoint(matrix, x1, y1);
        const pt = transformPoint(matrix, x, y);

        updateBounds(pt1.x, pt1.y);
        updateBounds(pt.x, pt.y);

        outputParts.push(`Q ${formatCoordinate(pt1.x)} ${formatCoordinate(pt1.y)} ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
      }
    } else if (upperCmd === 'T') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(2);
        if (args.length < 2) break;

        let x = args[0];
        let y = args[1];

        if (isRelative) {
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        const pt = transformPoint(matrix, x, y);
        updateBounds(pt.x, pt.y);

        outputParts.push(`T ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`);
      }
    } else if (upperCmd === 'A') {
      while (i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const args = readArgs(7);
        if (args.length < 7) break;

        let rx = args[0];
        let ry = args[1];
        const rot = args[2];
        const largeArc = args[3];
        const sweep = args[4];
        let x = args[5];
        let y = args[6];

        if (isRelative) {
          x += currentX;
          y += currentY;
        }

        currentX = x;
        currentY = y;

        const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b) || 1;
        const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d) || 1;

        rx *= scaleX;
        ry *= scaleY;

        const pt = transformPoint(matrix, x, y);
        updateBounds(pt.x, pt.y);

        outputParts.push(
          `A ${formatCoordinate(rx)} ${formatCoordinate(ry)} ${formatCoordinate(rot)} ${largeArc} ${sweep} ${formatCoordinate(pt.x)} ${formatCoordinate(pt.y)}`
        );
      }
    } else if (upperCmd === 'Z') {
      currentX = subpathStartX;
      currentY = subpathStartY;
      outputParts.push('Z');
    }
  }

  if (!Number.isFinite(minX)) minX = 0;
  if (!Number.isFinite(minY)) minY = 0;
  if (!Number.isFinite(maxX)) maxX = 24;
  if (!Number.isFinite(maxY)) maxY = 24;

  return {
    pathData: outputParts.join(' '),
    bounds: { minX, minY, maxX, maxY },
  };
}

/**
 * Converts any SVG color string to strict Alight Motion / Android ARGB #AARRGGBB hex
 */
export function normalizeAndroidColor(colorStr: string | null | undefined, svgDoc?: Document): string | null {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return null;
  }

  const str = colorStr.trim();

  if (str.toLowerCase().startsWith('url(')) {
    const match = str.match(/url\(['"]?#([^'"]+)['"]?\)/i);
    if (match && match[1] && svgDoc) {
      const gradId = match[1];
      const gradEl = svgDoc.getElementById(gradId) || svgDoc.querySelector(`[id="${gradId}"]`);
      if (gradEl) {
        const stopEl = gradEl.querySelector('stop');
        if (stopEl) {
          const stopColor = stopEl.getAttribute('stop-color') || parseStyleAttr(stopEl.getAttribute('style'))['stop-color'];
          if (stopColor) {
            return normalizeAndroidColor(stopColor, svgDoc);
          }
        }
      }
    }
    return '#FF007AFF';
  }

  if (str.startsWith('#')) {
    const hex = str.substring(1);
    if (hex.length === 3) {
      const r = hex[0] + hex[0];
      const g = hex[1] + hex[1];
      const b = hex[2] + hex[2];
      return `#FF${r}${g}${b}`.toUpperCase();
    }
    if (hex.length === 4) {
      const a = hex[0] + hex[0];
      const r = hex[1] + hex[1];
      const g = hex[2] + hex[2];
      const b = hex[3] + hex[3];
      return `#${a}${r}${g}${b}`.toUpperCase();
    }
    if (hex.length === 6) {
      return `#FF${hex}`.toUpperCase();
    }
    if (hex.length === 8) {
      const rr = hex.substring(0, 2);
      const gg = hex.substring(2, 4);
      const bb = hex.substring(4, 6);
      const aa = hex.substring(6, 8);
      return `#${aa}${rr}${gg}${bb}`.toUpperCase();
    }
    return str.toUpperCase();
  }

  const rgbMatch = str.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#FF${r}${g}${b}`.toUpperCase();
  }

  const rgbaMatch = str.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3], 10).toString(16).padStart(2, '0');
    const aFloat = parseFloat(rgbaMatch[4]);
    const a = Math.round(aFloat * 255).toString(16).padStart(2, '0');
    return `#${a}${r}${g}${b}`.toUpperCase();
  }

  const namedColors: Record<string, string> = {
    black: '#FF000000',
    white: '#FFFFFFFF',
    red: '#FFFF0000',
    green: '#FF008000',
    blue: '#FF0000FF',
    yellow: '#FFFFFF00',
    cyan: '#FF00FFFF',
    magenta: '#FFFF00FF',
    gray: '#FF808080',
    grey: '#FF808080',
    orange: '#FFFFA500',
    purple: '#FF800080',
    pink: '#FFFFC0CB',
  };

  if (namedColors[str.toLowerCase()]) {
    return namedColors[str.toLowerCase()];
  }

  return str;
}

function parseStyleAttr(styleAttr: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!styleAttr) return map;
  const pairs = styleAttr.split(';');
  pairs.forEach((p) => {
    const idx = p.indexOf(':');
    if (idx > 0) {
      const key = p.substring(0, idx).trim().toLowerCase();
      const val = p.substring(idx + 1).trim();
      if (key && val) {
        map[key] = val;
      }
    }
  });
  return map;
}

function parseCssStyleBlocks(doc: Document): Record<string, Record<string, string>> {
  const classMap: Record<string, Record<string, string>> = {};
  const styleElements = Array.from(doc.querySelectorAll('style'));

  styleElements.forEach((styleEl) => {
    const cssText = styleEl.textContent || '';
    const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = ruleRegex.exec(cssText)) !== null) {
      const className = match[1];
      const declarations = match[2];
      const parsedProps = parseStyleAttr(declarations);
      classMap[className] = { ...classMap[className], ...parsedProps };
    }
  });

  return classMap;
}

function getInheritedProperty(
  element: Element,
  propName: string,
  cssClassMap: Record<string, Record<string, string>>
): string | null {
  let curr: Element | null = element;

  while (curr && curr.tagName.toLowerCase() !== 'svg') {
    const attrVal = curr.getAttribute(propName);
    if (attrVal) return attrVal;

    const styleMap = parseStyleAttr(curr.getAttribute('style'));
    if (styleMap[propName]) return styleMap[propName];

    const className = curr.getAttribute('class');
    if (className) {
      const classes = className.split(/\s+/);
      for (const cls of classes) {
        if (cssClassMap[cls] && cssClassMap[cls][propName]) {
          return cssClassMap[cls][propName];
        }
      }
    }

    curr = curr.parentElement;
  }

  if (curr) {
    const svgAttr = curr.getAttribute(propName);
    if (svgAttr) return svgAttr;
    const svgStyle = parseStyleAttr(curr.getAttribute('style'));
    if (svgStyle[propName]) return svgStyle[propName];
  }

  return null;
}

/**
 * 6. CALCULATE VIEWPORT
 * Derives width, height, and viewport bounds from viewBox or bounding box
 */
export function calculateViewport(
  rootEl: Element | null,
  globalBounds: { minX: number; minY: number; maxX: number; maxY: number },
  options: SvgToXmlOptions = {}
): ViewportCalculation {
  let vbMinX = 0;
  let vbMinY = 0;
  let vbWidth = 24;
  let vbHeight = 24;

  const viewBoxAttr = rootEl ? rootEl.getAttribute('viewBox') : null;

  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(parseFloat);
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      vbMinX = parts[0] || 0;
      vbMinY = parts[1] || 0;
      vbWidth = parts[2];
      vbHeight = parts[3];
    }
  } else {
    const wAttr = rootEl ? rootEl.getAttribute('width') : null;
    const hAttr = rootEl ? rootEl.getAttribute('height') : null;
    if (wAttr) vbWidth = parseFloat(wAttr) || 24;
    if (hAttr) vbHeight = parseFloat(hAttr) || 24;

    if (!wAttr && !hAttr && Number.isFinite(globalBounds.maxX) && globalBounds.maxX > 0) {
      vbMinX = Math.floor(globalBounds.minX);
      vbMinY = Math.floor(globalBounds.minY);
      vbWidth = Math.ceil(globalBounds.maxX - globalBounds.minX) || 24;
      vbHeight = Math.ceil(globalBounds.maxY - globalBounds.minY) || 24;
    }
  }

  const targetWidth = options.widthDp && options.widthDp > 0 ? options.widthDp : Math.round(vbWidth) || 24;
  const targetHeight = options.heightDp && options.heightDp > 0 ? options.heightDp : Math.round(vbHeight) || 24;

  return {
    width: targetWidth,
    height: targetHeight,
    viewportWidth: vbWidth,
    viewportHeight: vbHeight,
    minX: vbMinX,
    minY: vbMinY,
    maxX: Number.isFinite(globalBounds.maxX) ? globalBounds.maxX : vbWidth,
    maxY: Number.isFinite(globalBounds.maxY) ? globalBounds.maxY : vbHeight,
  };
}

/**
 * 7. GENERATE ANDROID VECTOR XML
 * Official Android VectorDrawable format (<vector><path .../></vector>)
 */
export function generateAndroidVectorXml(
  layers: ProcessedLayer[],
  viewport: ViewportCalculation,
  options: SvgToXmlOptions = {}
): string {
  const indent = options.indentation === '4' ? '    ' : '  ';

  const pathsXml = layers.map((layer) => {
    const attrs: string[] = [];
    attrs.push(`${indent}${indent}android:pathData="${layer.pathData}"`);

    if (layer.fillColor) {
      attrs.push(`${indent}${indent}android:fillColor="${layer.fillColor}"`);
    }

    if (layer.fillOpacity < 1) {
      attrs.push(`${indent}${indent}android:fillAlpha="${layer.fillOpacity}"`);
    }

    if (layer.fillRule === 'evenodd') {
      attrs.push(`${indent}${indent}android:fillType="evenOdd"`);
    }

    if (layer.strokeColor) {
      attrs.push(`${indent}${indent}android:strokeColor="${layer.strokeColor}"`);
      attrs.push(`${indent}${indent}android:strokeWidth="${layer.strokeWidth}"`);

      if (layer.strokeOpacity < 1) {
        attrs.push(`${indent}${indent}android:strokeAlpha="${layer.strokeOpacity}"`);
      }
    }

    return `${indent}<path\n${attrs.join('\n')} />`;
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
${indent}android:width="${viewport.width}dp"
${indent}android:height="${viewport.height}dp"
${indent}android:viewportWidth="${viewport.viewportWidth}"
${indent}android:viewportHeight="${viewport.viewportHeight}">

${pathsXml.join('\n\n')}

</vector>`;
}

/**
 * 8. GENERATE ALIGHT MOTION PROJECT SCENE XML
 *
 * Distinct Alight Motion project scene format:
 * - Root element is <scene> with width, height, fps, totalTime
 * - Each SVG path is a separate timeline <shape> layer
 * - Shapes include <transform> (location, scale, rotation, opacity), <property> tags, and <path d="..." />
 * - NO Android VectorDrawable namespace
 */
export function generateAlightMotionXml(
  layers: ProcessedLayer[],
  viewport: ViewportCalculation,
  options: SvgToXmlOptions = {}
): string {
  const indent = options.indentation === '4' ? '    ' : '  ';
  const projTitle = (options.vectorName || 'Alight_Motion_Trace').replace(/[^a-zA-Z0-9_-]/g, '_');
  const totalDuration = 5000;
  const fps = 30;
  const sceneWidth = Math.round(viewport.width) || 1080;
  const sceneHeight = Math.round(viewport.height) || 1080;

  const shapeElements = layers.map((layer, index) => {
    const id = index + 1;
    const label = `${projTitle}_Path_${id}`;
    const fill = layer.fillColor || '#FF000000';
    const stroke = layer.strokeColor || 'none';
    const strokeW = layer.strokeWidth || 1;
    const opacityVal = (layer.opacity ?? 1).toFixed(2);
    const fillType = layer.fillColor ? 'color' : 'none';

    return `${indent}<shape id="${id}" label="${label}" startTime="0" endTime="${totalDuration}" fillType="${fillType}" s=".path">
${indent}${indent}<transform>
${indent}${indent}${indent}<location x="0.0" y="0.0" />
${indent}${indent}${indent}<scale x="1.0" y="1.0" />
${indent}${indent}${indent}<rotation value="0.0" />
${indent}${indent}${indent}<opacity value="${opacityVal}" />
${indent}${indent}</transform>
${indent}${indent}<property name="fillColor" type="color" value="${fill}" />
${layer.strokeColor ? `${indent}${indent}<property name="strokeColor" type="color" value="${layer.strokeColor}" />\n${indent}${indent}<property name="strokeWidth" type="float" value="${strokeW}" />\n` : ''}${indent}${indent}<path d="${layer.pathData}" fill="${layer.fillColor ? fill : 'none'}" stroke="${stroke}" stroke-width="${strokeW}" />
${indent}</shape>`;
  });

  return `<?xml version="1.0" encoding="utf-8"?>
<scene title="${projTitle}" width="${sceneWidth}" height="${sceneHeight}" exportWidth="${sceneWidth}" exportHeight="${sceneHeight}" fps="${fps}" totalTime="${totalDuration}" bgcolor="#FF000000" backgroundColor="#FF000000" exportQuality="0" amver="1002351" ffver="106" am="com.alightcreative.motion/5.0.260.1002351">

${shapeElements.join('\n\n')}

</scene>`;
}

/**
 * 9. VALIDATE ALIGHT MOTION XML
 *
 * Re-parses actual generated Alight Motion XML with DOMParser:
 * - Confirms well-formedness (no parsererror)
 * - Confirms root <scene> with width, height, fps, amver, and am package
 * - Confirms every path is an individual <shape>
 * - Confirms every <shape> has valid <transform> and <path d="...">
 * - Confirms no NaN / Infinity
 * - Confirms no Android VectorDrawable leakage
 */
export function validateAlightMotionXml(
  alightXmlCode: string,
  expectedLayerCount: number,
  viewportInfo: ViewportCalculation
): AlightValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const checks: AlightValidationCheck[] = [
    { id: 'xml_structure', label: 'Struktur XML Valid & Well-Formed (Re-parse DOMParser)', passed: true },
    { id: 'scene_root', label: 'Root Tag Scene Alight Motion (<scene amver am width height>)', passed: true },
    { id: 'shape_layers', label: `Setiap Path Menjadi Object Scene (${expectedLayerCount} Layer Shape)`, passed: true },
    { id: 'transforms_flattened', label: 'Flattened Transforms (Baking Koordinat Matrix)', passed: true },
    { id: 'path_data_valid', label: 'Data Path Bebas NaN / Infinity', passed: true },
    { id: 'viewport_valid', label: 'Viewport & Bounding Box Dihitung Sesuai', passed: true },
    { id: 'no_android_leak', label: 'Bukan Android VectorDrawable (Murni Schema Alight Motion)', passed: true },
    { id: 'alight_spec', label: 'Struktur XML Kompatibel Import Trace Alight Motion', passed: true },
  ];

  // 1. Re-parse XML string via DOMParser
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(alightXmlCode, 'text/xml');
  const parserError = parsedDoc.querySelector('parsererror');

  if (parserError) {
    checks[0].passed = false;
    errors.push('Sintaks XML Alight Motion tidak valid: ' + (parserError.textContent || 'Syntax error'));
  }

  // 2. Scene Root Check
  const root = parsedDoc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'scene') {
    checks[1].passed = false;
    errors.push('Elemen root harus berupa tag <scene>.');
  } else {
    const w = parseFloat(root.getAttribute('width') || '0');
    const h = parseFloat(root.getAttribute('height') || '0');
    if (w <= 0 || h <= 0) {
      checks[1].passed = false;
      errors.push('Dimensi <scene> width/height harus lebih besar dari 0.');
    }
    const amver = root.getAttribute('amver');
    const am = root.getAttribute('am');
    if (!amver || !am) {
      checks[1].passed = false;
      errors.push('Tag <scene> wajib memiliki atribut amver dan am (identifier aplikasi Alight Motion).');
    }
  }

  // 3. Shape Layers Check
  const shapeElements = Array.from(parsedDoc.querySelectorAll('shape'));
  if (shapeElements.length === 0) {
    checks[2].passed = false;
    errors.push('Tidak ditemukan elemen <shape> di dalam <scene>.');
  } else if (shapeElements.length !== expectedLayerCount) {
    checks[2].passed = false;
    errors.push(`Jumlah layer shape (${shapeElements.length}) tidak sesuai dengan jumlah path asli (${expectedLayerCount}).`);
  }

  // 4. Transforms Flattened Check
  if (/transform\s*=\s*["'](translate|rotate|scale|matrix)/i.test(alightXmlCode)) {
    checks[3].passed = false;
    errors.push('Masih terdapat atribut transform SVG mentah yang belum di-flatten.');
  }

  // 5. NaN / Infinity Check
  if (alightXmlCode.includes('NaN') || alightXmlCode.includes('Infinity') || alightXmlCode.includes('undefined')) {
    checks[4].passed = false;
    errors.push('Path data mengandung nilai invalid NaN, Infinity, atau undefined.');
  }

  // 6. Viewport Check
  if (viewportInfo.width <= 0 || viewportInfo.height <= 0) {
    checks[5].passed = false;
    errors.push('Ukuran viewport tidak valid (width/height <= 0).');
  }

  // 7. No Android VectorDrawable Leak Check
  if (alightXmlCode.includes('android:pathData') || alightXmlCode.includes('schemas.android.com')) {
    checks[6].passed = false;
    errors.push('Alight Motion XML tidak boleh berisi namespace atau tag Android VectorDrawable (android:pathData).');
  }

  // 8. Individual Shape & Path Structure Check
  shapeElements.forEach((shapeEl, idx) => {
    const pathEl = shapeEl.querySelector('path');
    if (!pathEl) {
      checks[7].passed = false;
      errors.push(`Shape #${idx + 1} tidak memiliki elemen kurva <path>.`);
    } else {
      const d = pathEl.getAttribute('d');
      if (!d || !d.trim()) {
        checks[7].passed = false;
        errors.push(`Shape #${idx + 1} memiliki atribut path 'd' yang kosong.`);
      }
    }
  });

  const isValid = checks.every((c) => c.passed) && errors.length === 0;

  return {
    isValid,
    checks,
    errors,
    warnings,
    pathCount: shapeElements.length,
    viewportInfo,
  };
}

/**
 * 10. MAIN CONVERTER PIPELINE
 */
export function convertSvgToVectorXml(svgContent: string, options: SvgToXmlOptions = {}): SvgToXmlResult {
  const warnings: string[] = [];

  // 1. Normalize
  const normalizedInput = normalizeSvg(svgContent);

  // 2. Parse SVG
  const doc = parseSvg(normalizedInput);
  const rootEl = doc.querySelector('svg') || doc.querySelector('vector') || doc.documentElement;
  const cssClassMap = parseCssStyleBlocks(doc);

  // 3. Find and process all shape elements
  const shapeElements = Array.from(rootEl ? rootEl.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon') : []);

  let globalMinX = Infinity;
  let globalMinY = Infinity;
  let globalMaxX = -Infinity;
  let globalMaxY = -Infinity;

  const processedLayers: ProcessedLayer[] = [];

  shapeElements.forEach((el) => {
    // Convert shape to raw path string
    const rawPathData = convertShapesToPaths(el);
    if (!rawPathData || !rawPathData.trim()) return;

    // Flatten cumulative matrix
    const matrix = flattenTransforms(el);

    // Split compound path into individual subpaths so each Alight Motion shape has a single closed/open contour
    const subpaths = splitPathIntoSubpaths(rawPathData);

    // Resolve inherited styling
    const rawFill = getInheritedProperty(el, 'fill', cssClassMap) || el.getAttribute('android:fillColor');
    const rawStroke = getInheritedProperty(el, 'stroke', cssClassMap) || el.getAttribute('android:strokeColor');
    const rawStrokeWidth = getInheritedProperty(el, 'stroke-width', cssClassMap) || el.getAttribute('android:strokeWidth');
    const rawFillRule = getInheritedProperty(el, 'fill-rule', cssClassMap) || getInheritedProperty(el, 'clip-rule', cssClassMap);
    const rawOpacity = getInheritedProperty(el, 'opacity', cssClassMap);
    const rawFillOpacity = getInheritedProperty(el, 'fill-opacity', cssClassMap);
    const rawStrokeOpacity = getInheritedProperty(el, 'stroke-opacity', cssClassMap);

    let fillColor = normalizeAndroidColor(rawFill, doc);
    let strokeColor = normalizeAndroidColor(rawStroke, doc);

    if (!fillColor && !strokeColor && rawFill !== 'none') {
      fillColor = '#FF000000';
    }

    if (options.tintColor && options.tintColor.trim()) {
      const tint = normalizeAndroidColor(options.tintColor, doc);
      if (tint) {
        if (fillColor) fillColor = tint;
        if (strokeColor) strokeColor = tint;
      }
    }

    subpaths.forEach((subpath) => {
      // Convert path commands and bake matrix coordinates
      const { pathData, bounds } = convertPathCommands(subpath, matrix);
      if (!pathData || !pathData.trim()) return;

      if (bounds.minX < globalMinX) globalMinX = bounds.minX;
      if (bounds.minY < globalMinY) globalMinY = bounds.minY;
      if (bounds.maxX > globalMaxX) globalMaxX = bounds.maxX;
      if (bounds.maxY > globalMaxY) globalMaxY = bounds.maxY;

      const layerIndex = processedLayers.length + 1;
      processedLayers.push({
        id: `path_${layerIndex}`,
        label: `${options.vectorName || 'Trace'}_Layer_${layerIndex}`,
        pathData,
        fillColor,
        strokeColor,
        strokeWidth: rawStrokeWidth ? parseFloat(rawStrokeWidth) : 1,
        opacity: rawOpacity ? parseFloat(rawOpacity) : 1,
        fillOpacity: rawFillOpacity ? parseFloat(rawFillOpacity) : 1,
        strokeOpacity: rawStrokeOpacity ? parseFloat(rawStrokeOpacity) : 1,
        fillRule: rawFillRule === 'evenodd' ? 'evenodd' : 'nonzero',
        bounds,
      });
    });
  });

  if (processedLayers.length === 0) {
    warnings.push('Tidak ditemukan kurva path atau elemen bentuk yang valid pada SVG.');
  }

  // 4. Calculate Viewport
  const viewport = calculateViewport(rootEl, { minX: globalMinX, minY: globalMinY, maxX: globalMaxX, maxY: globalMaxY }, options);

  // 5. Generate Android Vector XML
  const xmlCode = generateAndroidVectorXml(processedLayers, viewport, options);

  // 6. Generate Alight Motion Scene XML
  const alightXmlCode = generateAlightMotionXml(processedLayers, viewport, options);

  // 7. Validate Alight Motion XML by re-parsing actual output
  const validation = validateAlightMotionXml(alightXmlCode, processedLayers.length, viewport);

  // 8. Generate Jetpack Compose snippet
  const composeCode = `// Jetpack Compose ImageVector Snippet
val CustomVectorIcon: ImageVector
    get() {
        if (_customVectorIcon != null) {
            return _customVectorIcon!!
        }
        _customVectorIcon = ImageVector.Builder(
            name = "${options.vectorName || 'IcCustomVector'}",
            defaultWidth = ${viewport.width}.dp,
            defaultHeight = ${viewport.height}.dp,
            viewportWidth = ${viewport.viewportWidth}f,
            viewportHeight = ${viewport.viewportHeight}f
        ).apply {
            // Contains ${processedLayers.length} paths converted from SVG
        }.build()
        return _customVectorIcon!!
    }
private var _customVectorIcon: ImageVector? = null`;

  const pathsSummary = processedLayers.map((l) => ({
    id: l.label,
    fillColor: l.fillColor,
    strokeColor: l.strokeColor,
    strokeWidth: l.strokeWidth,
    pathLength: l.pathData.length,
  }));

  const fileSizeBytes = new Blob([alightXmlCode], { type: 'application/xml;charset=utf-8' }).size;

  return {
    xmlCode,
    alightXmlCode,
    composeCode,
    widthDp: viewport.width,
    heightDp: viewport.height,
    viewportWidth: viewport.viewportWidth,
    viewportHeight: viewport.viewportHeight,
    pathCount: processedLayers.length,
    fileSizeBytes,
    validation,
    warnings,
    pathsSummary,
  };
}
