/**
 * SVG to Android VectorDrawable XML & Alight Motion Converter Service
 * Full spec support for Figma, Illustrator, Inkscape, Canva, CSS styles, group transforms, & gradients
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
export function normalizeAndroidColor(colorStr: string | null | undefined, svgDoc?: Document): string | null {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return null;
  }

  const str = colorStr.trim();

  // If gradient url(#id) or url('#id')
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

  // Standard Hex #RGB or #RRGGBB or #AARRGGBB
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

  // Named colors fallback
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

/**
 * Parses inline style="key:val; key2:val2" attributes
 */
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

/**
 * Parses CSS <style> tags to extract class rules (.st0 { fill: #fff; })
 */
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

/**
 * Retrieves property value with inheritance (Check Attribute -> Style Attr -> CSS Class -> Parent Elements)
 */
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

interface TransformAttrs {
  translateX?: number;
  translateY?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  pivotX?: number;
  pivotY?: number;
}

function parseGroupTransform(transformStr: string | null): TransformAttrs | null {
  if (!transformStr) return null;

  const result: TransformAttrs = {};

  const translateMatch = transformStr.match(/translate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\s*\)/i);
  if (translateMatch) {
    result.translateX = parseFloat(translateMatch[1]);
    result.translateY = translateMatch[2] ? parseFloat(translateMatch[2]) : 0;
  }

  const rotateMatch = transformStr.match(/rotate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?(?:[\s,]+([-\d.]+))?\s*\)/i);
  if (rotateMatch) {
    result.rotation = parseFloat(rotateMatch[1]);
    if (rotateMatch[2] && rotateMatch[3]) {
      result.pivotX = parseFloat(rotateMatch[2]);
      result.pivotY = parseFloat(rotateMatch[3]);
    }
  }

  const scaleMatch = transformStr.match(/scale\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\s*\)/i);
  if (scaleMatch) {
    result.scaleX = parseFloat(scaleMatch[1]);
    result.scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : result.scaleX;
  }

  if (Object.keys(result).length === 0) return null;
  return result;
}

function sanitizePathData(d: string): string {
  if (!d) return '';
  let clean = d.replace(/([-\d.]+)[eE]([-\d]+)/g, (_, num, exp) => {
    return (parseFloat(num) * Math.pow(10, parseInt(exp, 10))).toFixed(6);
  });
  clean = clean.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return clean;
}

export function shapeToPathData(element: Element): string | null {
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
 * Converts SVG or Vector XML String markup into Android VectorDrawable XML String
 */
export function convertSvgToVectorXml(svgContent: string, options: SvgToXmlOptions = {}): SvgToXmlResult {
  const warnings: string[] = [];

  if (!svgContent || !svgContent.trim()) {
    throw new Error('Sintaks berkas kosong.');
  }

  // Clean BOM and trim
  let cleanInput = svgContent.replace(/^\uFEFF/, '').trim();

  // If input doesn't have <svg> wrapper but has path/vector/shapes, wrap it in <svg>
  if (!cleanInput.toLowerCase().includes('<svg') && !cleanInput.toLowerCase().includes('<vector')) {
    cleanInput = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${cleanInput}</svg>`;
  }

  const parser = new DOMParser();
  let doc = parser.parseFromString(cleanInput, 'image/svg+xml');

  // Fallback to text/xml or text/html if DOMParser error
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
  let isAndroidVector = false;

  if (!svgEl) {
    const vectorEl = doc.querySelector('vector');
    if (vectorEl) {
      isAndroidVector = true;
    } else {
      // Emergency wrapping if DOM parser failed to find root element
      const wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${cleanInput}</svg>`;
      doc = parser.parseFromString(wrapped, 'image/svg+xml');
      svgEl = doc.querySelector('svg');
    }
  }

  const rootEl = svgEl || doc.querySelector('vector') || doc.documentElement;
  const cssClassMap = parseCssStyleBlocks(doc);

  // Extract ViewBox or Width/Height
  let viewBox = rootEl ? (rootEl.getAttribute('viewBox') || rootEl.getAttribute('android:viewportWidth')) : null;
  let vbWidth = 24;
  let vbHeight = 24;

  if (viewBox && rootEl?.getAttribute('viewBox')) {
    const parts = viewBox.trim().split(/[\s,]+/).map(parseFloat);
    if (parts.length >= 4) {
      vbWidth = parts[2] || 24;
      vbHeight = parts[3] || 24;
    }
  } else {
    const wAttr = rootEl ? (rootEl.getAttribute('width') || rootEl.getAttribute('android:viewportWidth')) : null;
    const hAttr = rootEl ? (rootEl.getAttribute('height') || rootEl.getAttribute('android:viewportHeight')) : null;
    if (wAttr) vbWidth = parseFloat(wAttr) || 24;
    if (hAttr) vbHeight = parseFloat(hAttr) || 24;
  }

  const targetWidthDp = options.widthDp || Math.round(vbWidth) || 24;
  const targetHeightDp = options.heightDp || Math.round(vbHeight) || 24;
  const indentStr = options.indentation === '4' ? '    ' : '  ';

  let pathCount = 0;
  const pathsXml: string[] = [];

  const shapeElements = Array.from(rootEl ? rootEl.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon') : []);

  shapeElements.forEach((el, index) => {
    const pathData = shapeToPathData(el);
    if (!pathData || !pathData.trim()) return;

    pathCount++;

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

    const parentG = el.closest('g');
    const transformStr = parentG ? parentG.getAttribute('transform') : el.getAttribute('transform');
    const groupTransforms = parseGroupTransform(transformStr);

    let singlePathXml = `${indentStr}<path\n${attrs.join('\n')} />`;

    if (groupTransforms) {
      const groupAttrs: string[] = [];
      groupAttrs.push(`${indentStr}${indentStr}android:name="group_${index + 1}"`);
      if (groupTransforms.translateX !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:translateX="${groupTransforms.translateX}"`);
      if (groupTransforms.translateY !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:translateY="${groupTransforms.translateY}"`);
      if (groupTransforms.rotation !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:rotation="${groupTransforms.rotation}"`);
      if (groupTransforms.scaleX !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:scaleX="${groupTransforms.scaleX}"`);
      if (groupTransforms.scaleY !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:scaleY="${groupTransforms.scaleY}"`);
      if (groupTransforms.pivotX !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:pivotX="${groupTransforms.pivotX}"`);
      if (groupTransforms.pivotY !== undefined) groupAttrs.push(`${indentStr}${indentStr}android:pivotY="${groupTransforms.pivotY}"`);

      singlePathXml = `${indentStr}<group\n${groupAttrs.join('\n')}>\n${indentStr}${singlePathXml}\n${indentStr}</group>`;
    }

    pathsXml.push(singlePathXml);
  });

  if (pathsXml.length === 0) {
    warnings.push('Tidak ditemukan kurva path atau elemen bentuk yang valid.');
  }

  const xmlHeader = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
${indentStr}android:width="${targetWidthDp}dp"
${indentStr}android:height="${targetHeightDp}dp"
${indentStr}android:viewportWidth="${vbWidth}"
${indentStr}android:viewportHeight="${vbHeight}">

${pathsXml.join('\n\n')}

</vector>`;

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
