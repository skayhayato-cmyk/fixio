/**
 * SVG to Android VectorDrawable XML Converter Service
 */

export interface SvgToXmlOptions {
  widthDp?: number;
  heightDp?: number;
  tintColor?: string; // Optional color override (e.g. '#FFFFFF', '#000000', or empty for original)
  vectorName?: string;
  indentation?: '2' | '4';
  convertColorAlpha?: boolean;
  alightMotionPreset?: boolean; // Generate Alight Motion scene wrapper
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
  warnings: string[];
}

/**
 * Normalizes SVG color string to Android ARGB Hex string (#AARRGGBB)
 * Enforces strict 8-digit ARGB format required by Alight Motion and Android XML parsers
 */
export function normalizeAndroidColor(colorStr: string | null | undefined): string | null {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return null;
  }

  const str = colorStr.trim();

  // Standard Hex #RGB or #RRGGBB or #AARRGGBB
  if (str.startsWith('#')) {
    const hex = str.substring(1);
    if (hex.length === 3) {
      // #RGB -> #FFRRGGBB
      const r = hex[0] + hex[0];
      const g = hex[1] + hex[1];
      const b = hex[2] + hex[2];
      return `#FF${r}${g}${b}`.toUpperCase();
    }
    if (hex.length === 4) {
      // #ARGB -> #AARRGGBB
      const a = hex[0] + hex[0];
      const r = hex[1] + hex[1];
      const g = hex[2] + hex[2];
      const b = hex[3] + hex[3];
      return `#${a}${r}${g}${b}`.toUpperCase();
    }
    if (hex.length === 6) {
      // #RRGGBB -> #FFRRGGBB
      return `#FF${hex}`.toUpperCase();
    }
    if (hex.length === 8) {
      // SVG #RRGGBBAA -> Android #AARRGGBB
      const rr = hex.substring(0, 2);
      const gg = hex.substring(2, 4);
      const bb = hex.substring(4, 6);
      const aa = hex.substring(6, 8);
      return `#${aa}${rr}${gg}${bb}`.toUpperCase();
    }
    return str.toUpperCase();
  }

  // rgb(r, g, b)
  const rgbMatch = str.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#FF${r}${g}${b}`.toUpperCase();
  }

  // rgba(r, g, b, a)
  const rgbaMatch = str.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3], 10).toString(16).padStart(2, '0');
    const aFloat = parseFloat(rgbaMatch[4]);
    const a = Math.round(aFloat * 255).toString(16).padStart(2, '0');
    return `#${a}${r}${g}${b}`.toUpperCase();
  }

  // Named colors fallback with 8-digit ARGB
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
  };

  if (namedColors[str.toLowerCase()]) {
    return namedColors[str.toLowerCase()];
  }

  return str;
}

/**
 * Converts basic SVG shapes (<rect>, <circle>, <ellipse>, <line>, <polygon>, <polyline>) to path data string
 */
export function shapeToPathData(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'path') {
    return element.getAttribute('d') || null;
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
      // Rounded rect
      const rX = Math.min(rx, w / 2);
      const rY = Math.min(ry, h / 2);
      return `M ${x + rX},${y} h ${w - 2 * rX} a ${rX},${rY} 0 0 1 ${rX},${rY} v ${h - 2 * rY} a ${rX},${rY} 0 0 1 -${rX},${rY} h -${w - 2 * rX} a ${rX},${rY} 0 0 1 -${rX},-${rY} v -${h - 2 * rY} a ${rX},${rY} 0 0 1 ${rX},-${rY} Z`;
    }

    return `M ${x},${y} h ${w} v ${h} h -${w} Z`;
  }

  if (tagName === 'circle') {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const r = parseFloat(element.getAttribute('r') || '0');
    if (r <= 0) return null;
    return `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0 Z`;
  }

  if (tagName === 'ellipse') {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');
    const rx = parseFloat(element.getAttribute('rx') || '0');
    const ry = parseFloat(element.getAttribute('ry') || '0');
    if (rx <= 0 || ry <= 0) return null;
    return `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 -${rx * 2},0 Z`;
  }

  if (tagName === 'line') {
    const x1 = element.getAttribute('x1') || '0';
    const y1 = element.getAttribute('y1') || '0';
    const x2 = element.getAttribute('x2') || '0';
    const y2 = element.getAttribute('y2') || '0';
    return `M ${x1},${y1} L ${x2},${y2}`;
  }

  if (tagName === 'polyline' || tagName === 'polygon') {
    const pointsAttr = element.getAttribute('points') || '';
    const points = pointsAttr
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (points.length < 2) return null;

    let path = `M ${points[0]},${points[1]}`;
    for (let i = 2; i < points.length; i += 2) {
      if (points[i] && points[i + 1]) {
        path += ` L ${points[i]},${points[i + 1]}`;
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
 * Converts SVG String markup into Android VectorDrawable XML String
 */
export function convertSvgToVectorXml(svgContent: string, options: SvgToXmlOptions = {}): SvgToXmlResult {
  const warnings: string[] = [];

  // Parse SVG using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Format SVG tidak valid atau korup. Silakan periksa kembali sintaks SVG.');
  }

  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    throw new Error('Elemen <svg> tidak ditemukan dalam berkas.');
  }

  // Extract ViewBox or Width/Height
  let viewBox = svgEl.getAttribute('viewBox');
  let vbWidth = 24;
  let vbHeight = 24;

  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(parseFloat);
    if (parts.length >= 4) {
      vbWidth = parts[2] || 24;
      vbHeight = parts[3] || 24;
    }
  } else {
    const wAttr = svgEl.getAttribute('width');
    const hAttr = svgEl.getAttribute('height');
    if (wAttr) vbWidth = parseFloat(wAttr) || 24;
    if (hAttr) vbHeight = parseFloat(hAttr) || 24;
  }

  const targetWidthDp = options.widthDp || Math.round(vbWidth) || 24;
  const targetHeightDp = options.heightDp || Math.round(vbHeight) || 24;

  const indentStr = options.indentation === '4' ? '    ' : '  ';

  let pathCount = 0;
  const pathsXml: string[] = [];

  // Find all drawable shape elements
  const shapeElements = Array.from(svgEl.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon'));

  shapeElements.forEach((el) => {
    const pathData = shapeToPathData(el);
    if (!pathData || !pathData.trim()) return;

    pathCount++;

    // Attributes extraction
    const rawFill = el.getAttribute('fill') || svgEl.getAttribute('fill');
    const rawStroke = el.getAttribute('stroke') || svgEl.getAttribute('stroke');
    const rawStrokeWidth = el.getAttribute('stroke-width') || svgEl.getAttribute('stroke-width');
    const rawFillType = el.getAttribute('fill-rule') || el.getAttribute('clip-rule');
    const rawOpacity = el.getAttribute('opacity') || el.getAttribute('fill-opacity');
    const rawStrokeOpacity = el.getAttribute('stroke-opacity');

    let fillColor = normalizeAndroidColor(rawFill);
    let strokeColor = normalizeAndroidColor(rawStroke);

    // Default fill if neither fill nor stroke is defined
    if (!fillColor && !strokeColor && rawFill !== 'none') {
      fillColor = '#FF000000'; // Default black fill
    }

    // Color tint override if option enabled
    if (options.tintColor && options.tintColor.trim()) {
      const tint = normalizeAndroidColor(options.tintColor);
      if (tint) {
        if (fillColor) fillColor = tint;
        if (strokeColor) strokeColor = tint;
      }
    }

    const attrs: string[] = [];

    // Path Data
    attrs.push(`${indentStr}${indentStr}android:pathData="${pathData.trim()}"`);

    // Fill Color
    if (fillColor) {
      attrs.push(`${indentStr}${indentStr}android:fillColor="${fillColor}"`);
    }

    // Fill Alpha
    if (rawOpacity && parseFloat(rawOpacity) < 1) {
      attrs.push(`${indentStr}${indentStr}android:fillAlpha="${parseFloat(rawOpacity)}"`);
    }

    // Fill Type (EvenOdd / NonZero)
    if (rawFillType === 'evenodd') {
      attrs.push(`${indentStr}${indentStr}android:fillType="evenOdd"`);
    }

    // Stroke Color & Width
    if (strokeColor) {
      attrs.push(`${indentStr}${indentStr}android:strokeColor="${strokeColor}"`);
      const sw = rawStrokeWidth ? parseFloat(rawStrokeWidth) : 1;
      attrs.push(`${indentStr}${indentStr}android:strokeWidth="${sw}"`);

      if (rawStrokeOpacity && parseFloat(rawStrokeOpacity) < 1) {
        attrs.push(`${indentStr}${indentStr}android:strokeAlpha="${parseFloat(rawStrokeOpacity)}"`);
      }

      const strokeLineCap = el.getAttribute('stroke-linecap');
      if (strokeLineCap) {
        attrs.push(`${indentStr}${indentStr}android:strokeLineCap="${strokeLineCap}"`);
      }

      const strokeLineJoin = el.getAttribute('stroke-linejoin');
      if (strokeLineJoin) {
        attrs.push(`${indentStr}${indentStr}android:strokeLineJoin="${strokeLineJoin}"`);
      }
    }

    pathsXml.push(`${indentStr}<path\n${attrs.join('\n')} />`);
  });

  if (pathsXml.length === 0) {
    warnings.push('Tidak ditemukan kurva path atau elemen bentuk yang valid pada SVG.');
  }

  // Construct full Android VectorDrawable XML with required XML declaration
  const xmlHeader = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
${indentStr}android:width="${targetWidthDp}dp"
${indentStr}android:height="${targetHeightDp}dp"
${indentStr}android:viewportWidth="${vbWidth}"
${indentStr}android:viewportHeight="${vbHeight}">

${pathsXml.join('\n\n')}

</vector>`;

  // Construct Alight Motion Project Preset XML format
  const alightXmlCode = `<?xml version="1.0" encoding="utf-8"?>
<scene width="${targetWidthDp}" height="${targetHeightDp}" fps="30" backgroundColor="#FF000000">
  <shape name="${options.vectorName || 'Vector_Layer'}" type="vector">
    <vector xmlns:android="http://schemas.android.com/apk/res/android"
      android:width="${targetWidthDp}dp"
      android:height="${targetHeightDp}dp"
      android:viewportWidth="${vbWidth}"
      android:viewportHeight="${vbHeight}">

${pathsXml.map(p => '    ' + p).join('\n\n')}

    </vector>
  </shape>
</scene>`;

  // Generate Jetpack Compose ImageVector Kotlin snippet
  const composeSnippet = `// Jetpack Compose ImageVector Snippet
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

  const fileSizeBytes = new Blob([xmlHeader], { type: 'application/xml;charset=utf-8' }).size;

  return {
    xmlCode: xmlHeader,
    alightXmlCode,
    composeCode: composeSnippet,
    widthDp: targetWidthDp,
    heightDp: targetHeightDp,
    viewportWidth: vbWidth,
    viewportHeight: vbHeight,
    pathCount,
    fileSizeBytes,
    warnings,
  };
}
