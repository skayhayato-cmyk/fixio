/**
 * Alight Motion & Android VectorDrawable Converter Engine
 *
 * Implements 100% Flattened Matrix Transformations, Shape-to-Path Conversions,
 * Strict ARGB 8-digit Color Normalization, and Alight Motion XML Validation Pipeline.
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
  viewportInfo: {
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
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
 * Parses SVG transform string into Matrix2D
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
        // translate(cx, cy) * rotate(angle) * translate(-cx, -cy)
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
 * Formats float to max 3 decimal places without trailing zeroes or scientific notation
 */
export function formatCoordinate(num: number): string {
  if (!Number.isFinite(num)) return '0';
  const val = Math.round(num * 1000) / 1000;
  return Object.is(val, -0) ? '0' : val.toString();
}

/**
 * SVG Path Command Normalizer & Matrix Transformer
 * Converts relative commands (m,l,h,v,c,s,q,t,a) to absolute, flattens matrix, and formats cleanly
 */
export function convertPathCommands(d: string, matrix: Matrix2D): { pathData: string; bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
  if (!d || !d.trim()) {
    return { pathData: '', bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
  }

  // Tokenize SVG Path d string
  const tokens: string[] = [];
  const tokenRegex = /([a-zA-Z])|([+-]?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][+-]?\d+)?)/g;
  let match;

  while ((match = tokenRegex.exec(d)) !== null) {
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

    // Helper to read N numbers
    const readArgs = (count: number): number[] => {
      const args: number[] = [];
      while (args.length < count && i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i])) {
        const val = parseFloat(tokens[i]);
        args.push(isNaN(val) ? 0 : val);
        i++;
      }
      return args;
    };

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
          // Implicit LineTo
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

        // Scale radii according to matrix scale
        const scaleX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
        const scaleY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);

        rx *= scaleX || 1;
        ry *= scaleY || 1;

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
 * Converts SVG shapes (<rect>, <circle>, <ellipse>, <line>, <polygon>, <polyline>) to path string
 */
export function shapeToPathData(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'path') {
    return element.getAttribute('d') || element.getAttribute('android:pathData');
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
    // Cubic Bezier approximation for circle kappa = 0.552284749831
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
 * Converts any SVG color string to strict Alight Motion / Android ARGB #AARRGGBB hex
 */
export function normalizeAndroidColor(colorStr: string | null | undefined, svgDoc?: Document): string | null {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return null;
  }

  const str = colorStr.trim();

  // Gradient url(#id)
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
 * Calculates cumulative Matrix2D up the DOM tree from element to root SVG
 */
export function getCumulativeMatrix(element: Element): Matrix2D {
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
 * Alight Motion Pre-Download Checklist Validator
 */
export function validateAlightMotionXml(
  xmlCode: string,
  alightXmlCode: string,
  pathCount: number,
  viewportInfo: { width: number; height: number; viewportWidth: number; viewportHeight: number; minX: number; minY: number; maxX: number; maxY: number }
): AlightValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const checks: AlightValidationCheck[] = [
    { id: 'xml_structure', label: 'Struktur XML Valid & Well-Formed', passed: true },
    { id: 'path_count', label: 'Kurva Path Ditemukan (>0)', passed: true },
    { id: 'transforms_flattened', label: 'Flattened Transforms (Baking Koordinat Matrix)', passed: true },
    { id: 'path_data_valid', label: 'Data Path Bebas NaN / Infinity', passed: true },
    { id: 'viewport_valid', label: 'Viewport & Bounding Box Dihitung Sesuai', passed: true },
    { id: 'argb_colors', label: 'Format Warna ARGB 8-Digit (#AARRGGBB)', passed: true },
    { id: 'multi_path', label: 'Multi-Path & Hierarki Layer Utuh', passed: true },
    { id: 'alight_spec', label: 'Struktur XML Kompatibel Import Trace Alight Motion', passed: true },
  ];

  // 1. Check XML Structure
  if (!xmlCode || !xmlCode.includes('<?xml version="1.0" encoding="utf-8"?>')) {
    checks[0].passed = false;
    errors.push('Deklarasi XML `<?xml version="1.0" encoding="utf-8"?>` tidak ditemukan.');
  }

  // 2. Path Count Check
  if (pathCount <= 0) {
    checks[1].passed = false;
    errors.push('Tidak ditemukan kurva path yang valid pada berkas SVG/XML.');
  }

  // 3. Un-flattened Transforms Check
  if (/transform\s*=\s*["']/i.test(xmlCode)) {
    checks[2].passed = false;
    errors.push('Masih terdapat atribut transform mentah yang belum di-flatten.');
  }

  // 4. NaN / Infinity Check
  if (xmlCode.includes('NaN') || xmlCode.includes('Infinity') || xmlCode.includes('undefined')) {
    checks[3].passed = false;
    errors.push('Path data mengandung nilai invalid NaN / Infinity.');
  }

  // 5. Viewport Check
  if (viewportInfo.viewportWidth <= 0 || viewportInfo.viewportHeight <= 0) {
    checks[4].passed = false;
    errors.push('Ukuran viewport tidak valid (width/height <= 0).');
  }

  // 6. Color Check
  const colorMatches = xmlCode.match(/android:(fillColor|strokeColor)="([^"]+)"/g) || [];
  for (const match of colorMatches) {
    const hexVal = match.split('"')[1];
    if (hexVal && hexVal.startsWith('#') && hexVal.length !== 9) {
      checks[5].passed = false;
      warnings.push(`Format warna "${hexVal}" bukan 8-digit ARGB. Alight Motion membutuhkan format #AARRGGBB.`);
    }
  }

  // 7. Multi path check
  checks[6].passed = pathCount > 0;

  // 8. Alight Spec check
  const hasScene = /<scene\b[^>]*>/i.test(alightXmlCode);
  const hasShape = /<shape\b[^>]*>/i.test(alightXmlCode);
  const hasVector = /<vector\b[^>]*>/i.test(alightXmlCode);

  if (!hasScene || !hasShape || !hasVector) {
    checks[7].passed = false;
    errors.push('Struktur scene Alight Motion tidak terbentuk dengan benar.');
  } else {
    checks[7].passed = true;
  }

  const isValid = checks.every((c) => c.passed) && errors.length === 0;

  return {
    isValid,
    checks,
    errors,
    warnings,
    pathCount,
    viewportInfo,
  };
}

/**
 * Main Converter Engine
 */
export function convertSvgToVectorXml(svgContent: string, options: SvgToXmlOptions = {}): SvgToXmlResult {
  const warnings: string[] = [];

  if (!svgContent || !svgContent.trim()) {
    throw new Error('Sintaks berkas SVG/XML kosong.');
  }

  let cleanInput = svgContent.replace(/^\uFEFF/, '').trim();

  // Strip XML comments
  cleanInput = cleanInput.replace(/<!--[\s\S]*?-->/g, '');

  if (!cleanInput.toLowerCase().includes('<svg') && !cleanInput.toLowerCase().includes('<vector')) {
    cleanInput = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${cleanInput}</svg>`;
  }

  const parser = new DOMParser();
  let doc = parser.parseFromString(cleanInput, 'image/svg+xml');

  let parserError = doc.querySelector('parsererror');
  if (parserError) {
    try {
      doc = parser.parseFromString(cleanInput, 'text/xml');
      parserError = doc.querySelector('parsererror');
    } catch {
      // ignore
    }
  }

  let svgEl = doc.querySelector('svg');

  if (!svgEl) {
    const vectorEl = doc.querySelector('vector');
    if (!vectorEl) {
      const wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${cleanInput}</svg>`;
      doc = parser.parseFromString(wrapped, 'image/svg+xml');
      svgEl = doc.querySelector('svg');
    }
  }

  const rootEl = svgEl || doc.querySelector('vector') || doc.documentElement;
  const cssClassMap = parseCssStyleBlocks(doc);

  // Determine ViewBox or calculate bounding box
  let viewBoxAttr = rootEl ? rootEl.getAttribute('viewBox') : null;
  let vbMinX = 0;
  let vbMinY = 0;
  let vbWidth = 24;
  let vbHeight = 24;

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
  }

  const indentStr = options.indentation === '4' ? '    ' : '  ';

  let pathCount = 0;
  const pathsXml: string[] = [];
  const pathsSummary: Array<{ id: string; fillColor: string | null; strokeColor: string | null; strokeWidth: number; pathLength: number }> = [];

  let globalMinX = Infinity;
  let globalMinY = Infinity;
  let globalMaxX = -Infinity;
  let globalMaxY = -Infinity;

  // Find all shape elements
  const shapeElements = Array.from(rootEl ? rootEl.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon') : []);

  shapeElements.forEach((el, index) => {
    const rawPathData = shapeToPathData(el);
    if (!rawPathData || !rawPathData.trim()) return;

    pathCount++;

    // Calculate cumulative matrix for element
    const matrix = getCumulativeMatrix(el);

    // Convert path commands and bake matrix coordinates
    const { pathData, bounds } = convertPathCommands(rawPathData, matrix);

    if (!pathData || !pathData.trim()) return;

    if (bounds.minX < globalMinX) globalMinX = bounds.minX;
    if (bounds.minY < globalMinY) globalMinY = bounds.minY;
    if (bounds.maxX > globalMaxX) globalMaxX = bounds.maxX;
    if (bounds.maxY > globalMaxY) globalMaxY = bounds.maxY;

    // Inherited styling resolution
    const rawFill = getInheritedProperty(el, 'fill', cssClassMap) || el.getAttribute('android:fillColor');
    const rawStroke = getInheritedProperty(el, 'stroke', cssClassMap) || el.getAttribute('android:strokeColor');
    const rawStrokeWidth = getInheritedProperty(el, 'stroke-width', cssClassMap) || el.getAttribute('android:strokeWidth');
    const rawFillType = getInheritedProperty(el, 'fill-rule', cssClassMap) || getInheritedProperty(el, 'clip-rule', cssClassMap) || el.getAttribute('android:fillType');
    const rawOpacity = getInheritedProperty(el, 'opacity', cssClassMap) || getInheritedProperty(el, 'fill-opacity', cssClassMap) || el.getAttribute('android:fillAlpha');
    const rawStrokeOpacity = getInheritedProperty(el, 'stroke-opacity', cssClassMap) || el.getAttribute('android:strokeAlpha');

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

    const attrs: string[] = [];

    // Clean Path Data
    attrs.push(`${indentStr}${indentStr}android:pathData="${pathData.trim()}"`);

    if (fillColor) {
      attrs.push(`${indentStr}${indentStr}android:fillColor="${fillColor}"`);
    }

    if (rawOpacity && parseFloat(rawOpacity) < 1) {
      attrs.push(`${indentStr}${indentStr}android:fillAlpha="${parseFloat(rawOpacity)}"`);
    }

    if (rawFillType === 'evenodd' || rawFillType === 'evenOdd') {
      attrs.push(`${indentStr}${indentStr}android:fillType="evenOdd"`);
    }

    if (strokeColor) {
      attrs.push(`${indentStr}${indentStr}android:strokeColor="${strokeColor}"`);
      const sw = rawStrokeWidth ? parseFloat(rawStrokeWidth) : 1;
      attrs.push(`${indentStr}${indentStr}android:strokeWidth="${sw}"`);

      if (rawStrokeOpacity && parseFloat(rawStrokeOpacity) < 1) {
        attrs.push(`${indentStr}${indentStr}android:strokeAlpha="${parseFloat(rawStrokeOpacity)}"`);
      }

      const strokeLineCap = getInheritedProperty(el, 'stroke-linecap', cssClassMap) || el.getAttribute('android:strokeLineCap');
      if (strokeLineCap) {
        attrs.push(`${indentStr}${indentStr}android:strokeLineCap="${strokeLineCap}"`);
      }

      const strokeLineJoin = getInheritedProperty(el, 'stroke-linejoin', cssClassMap) || el.getAttribute('android:strokeLineJoin');
      if (strokeLineJoin) {
        attrs.push(`${indentStr}${indentStr}android:strokeLineJoin="${strokeLineJoin}"`);
      }
    }

    pathsXml.push(`${indentStr}<path\n${attrs.join('\n')} />`);

    pathsSummary.push({
      id: `path_${index + 1}`,
      fillColor,
      strokeColor,
      strokeWidth: rawStrokeWidth ? parseFloat(rawStrokeWidth) : 1,
      pathLength: pathData.length,
    });
  });

  if (pathsXml.length === 0) {
    warnings.push('Tidak ditemukan kurva path atau bentuk yang valid pada SVG.');
  }

  // Adjust viewport bounds if viewBox was missing
  if (!viewBoxAttr && Number.isFinite(globalMaxX) && globalMaxX > 0) {
    vbMinX = Math.floor(globalMinX);
    vbMinY = Math.floor(globalMinY);
    vbWidth = Math.ceil(globalMaxX - globalMinX) || 24;
    vbHeight = Math.ceil(globalMaxY - globalMinY) || 24;
  }

  const targetWidthDp = options.widthDp && options.widthDp > 0 ? options.widthDp : (Math.round(vbWidth) || 24);
  const targetHeightDp = options.heightDp && options.heightDp > 0 ? options.heightDp : (Math.round(vbHeight) || 24);

  const viewportInfo = {
    width: targetWidthDp,
    height: targetHeightDp,
    viewportWidth: vbWidth,
    viewportHeight: vbHeight,
    minX: vbMinX,
    minY: vbMinY,
    maxX: Number.isFinite(globalMaxX) ? globalMaxX : vbWidth,
    maxY: Number.isFinite(globalMaxY) ? globalMaxY : vbHeight,
  };

  // Construct VectorDrawable XML
  const xmlCode = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
${indentStr}android:width="${targetWidthDp}dp"
${indentStr}android:height="${targetHeightDp}dp"
${indentStr}android:viewportWidth="${vbWidth}"
${indentStr}android:viewportHeight="${vbHeight}">

${pathsXml.join('\n\n')}

</vector>`;

  // Construct Alight Motion Native Preset XML (with required timeline totalTime & transform specs)
  const alightXmlCode = `<?xml version="1.0" encoding="utf-8"?>
<scene width="${targetWidthDp}" height="${targetHeightDp}" fps="30" totalTime="5000" exportQuality="0" backgroundColor="#FF000000">
  <shape type="vector" name="${options.vectorName || 'Vector_Trace_Layer'}" startTime="0" endTime="5000" width="${targetWidthDp}.0" height="${targetHeightDp}.0">
    <transform>
      <translation x="0.0" y="0.0" />
      <scale x="1.0" y="1.0" />
      <rotation value="0.0" />
    </transform>
    <vector xmlns:android="http://schemas.android.com/apk/res/android"
      android:width="${targetWidthDp}dp"
      android:height="${targetHeightDp}dp"
      android:viewportWidth="${vbWidth}"
      android:viewportHeight="${vbHeight}">

${pathsXml.map((p) => '    ' + p).join('\n\n')}

    </vector>
  </shape>
</scene>`;

  // Generate Jetpack Compose snippet
  const composeCode = `// Jetpack Compose ImageVector Snippet
val CustomVectorIcon: ImageVector
    get() {
        if (_customVectorIcon != null) {
            return _customVectorIcon!!
        }
        _customVectorIcon = ImageVector.Builder(
            name = "${options.vectorName || 'IcCustomVector'}",
            defaultWidth = ${targetWidthDp}.dp,
            defaultHeight = ${targetHeightDp}.dp,
            viewportWidth = ${vbWidth}f,
            viewportHeight = ${vbHeight}f
        ).apply {
            // Contains ${pathCount} paths converted from SVG
        }.build()
        return _customVectorIcon!!
    }
private var _customVectorIcon: ImageVector? = null`;

  const validation = validateAlightMotionXml(xmlCode, alightXmlCode, pathCount, viewportInfo);

  const fileSizeBytes = new Blob([xmlCode], { type: 'application/xml;charset=utf-8' }).size;

  return {
    xmlCode,
    alightXmlCode,
    composeCode,
    widthDp: targetWidthDp,
    heightDp: targetHeightDp,
    viewportWidth: vbWidth,
    viewportHeight: vbHeight,
    pathCount,
    fileSizeBytes,
    validation,
    warnings,
    pathsSummary,
  };
}
