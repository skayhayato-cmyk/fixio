/**
 * SVG to Alight Motion XML Converter
 * Faithfully ports the PHP SvgToAlight engine to client-side TypeScript.
 * Generates official Alight Motion XML project format with <shape>, <path d="..."/>,
 * <transform><location/>, <fillColor>, <gradient>, and nested <embedScene fillType="intrinsic">.
 */

export const AM_BUILD = "1028425";
export const AM_FFVER = "106";
export const AM_STRING = "com.alightcreative.motion/5.0.273.1028425";

export interface AlightOptions {
  preset: "orig" | "1:1" | "16:9" | "9:16" | "4:5" | "4:3" | "custom";
  cw: number;
  ch: number;
  duration: number; // in seconds
  fps: number;
  grouping: "flat" | "nested";
  prim: boolean; // detect rect primitives
  cstroke: boolean; // remove hairline stroke matching fill
  engine: "max" | "patch";
  patch: number; // small patch threshold (% of canvas)
  protect: number; // protect thin lines (%)
  exclude: number[];
}

export interface AlightLayerInfo {
  i: number;
  name: string;
  color: string | null;
  grad: boolean;
  stroke: boolean;
  nodes: number;
}

export interface AlightStats {
  total: number;
  selected: number;
  colors: number;
  gradients: number;
  strokes: number;
  clips: number;
  primitives: number;
  removedSub: number;
  removedShape: number;
  removedNodes: number;
}

export interface AlightResult {
  ok: boolean;
  src: { w: number; h: number };
  canvas: { w: number; h: number };
  fps: number;
  duration: number;
  grouping: "flat" | "nested";
  engine: "max" | "patch";
  layers: AlightLayerInfo[];
  stats: AlightStats;
  warnings: string[];
  xml: string;
  xmlBytes: number;
}

/* ───────────────────────── 2D Affine Matrix ───────────────────────── */
export class Mat {
  static id(): number[] {
    return [1.0, 0.0, 0.0, 1.0, 0.0, 0.0];
  }

  static mul(p: number[], q: number[]): number[] {
    return [
      p[0] * q[0] + p[2] * q[1],
      p[1] * q[0] + p[3] * q[1],
      p[0] * q[2] + p[2] * q[3],
      p[1] * q[2] + p[3] * q[3],
      p[0] * q[4] + p[2] * q[5] + p[4],
      p[1] * q[4] + p[3] * q[5] + p[5],
    ];
  }

  static apply(m: number[], x: number, y: number): [number, number] {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }

  static det(m: number[]): number {
    return m[0] * m[3] - m[1] * m[2];
  }

  static parse(s: string): number[] {
    let m = this.id();
    const regex = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(s)) !== null) {
      const type = match[1].toLowerCase();
      const a = match[2]
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);
      const n = a.length;
      let x = this.id();

      switch (type) {
        case "matrix":
          if (n >= 6) x = [a[0], a[1], a[2], a[3], a[4], a[5]];
          break;
        case "translate":
          x = [1.0, 0.0, 0.0, 1.0, a[0] ?? 0.0, a[1] ?? 0.0];
          break;
        case "scale": {
          const sx = a[0] ?? 1.0;
          const sy = a[1] ?? sx;
          x = [sx, 0.0, 0.0, sy, 0.0, 0.0];
          break;
        }
        case "rotate": {
          const r = ((a[0] ?? 0.0) * Math.PI) / 180;
          const c = Math.cos(r);
          const s2 = Math.sin(r);
          x = [c, s2, -s2, c, 0.0, 0.0];
          if (n >= 3) {
            x = this.mul(this.mul([1, 0, 0, 1, a[1], a[2]], x), [1, 0, 0, 1, -a[1], -a[2]]);
          }
          break;
        }
        case "skewx":
          x = [1.0, 0.0, Math.tan(((a[0] ?? 0.0) * Math.PI) / 180), 1.0, 0.0, 0.0];
          break;
        case "skewy":
          x = [1.0, Math.tan(((a[0] ?? 0.0) * Math.PI) / 180), 0.0, 1.0, 0.0, 0.0];
          break;
      }
      m = this.mul(m, x);
    }
    return m;
  }
}

/* ───────────────────────── Main Converter ───────────────────────── */
export class SvgToAlightConverter {
  private static KAPPA = 0.5522847498;
  private static PROPS = [
    "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity",
    "stroke-linecap", "stroke-linejoin", "opacity", "display", "visibility", "color",
    "stop-color", "stop-opacity", "clip-path", "mask", "filter",
  ];
  private static INHERIT = [
    "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity",
    "stroke-linecap", "stroke-linejoin", "color", "visibility",
  ];
  private static SKIP = [
    "defs", "clippath", "mask", "symbol", "lineargradient", "radialgradient", "pattern",
    "marker", "style", "title", "desc", "metadata", "filter", "script", "stop", "animate",
    "animatetransform", "set",
  ];
  private static PRESETS: Record<string, [number, number]> = {
    "1:1": [1080, 1080],
    "16:9": [1920, 1080],
    "9:16": [1080, 1920],
    "4:5": [1080, 1350],
    "4:3": [1440, 1080],
  };

  private o: AlightOptions;
  private root: Element | null = null;
  private ids: Record<string, Element> = {};
  private css: [string, Record<string, string>, number, number][] = [];
  private vx = 0;
  private vy = 0;
  private vw = 1024;
  private vh = 1024;
  private cw = 1024;
  private ch = 1024;
  private base: number[] = Mat.id();
  private idx = 0;
  private nextId = 1;
  private totalMs = 2000;
  private budget = 80000;
  private groupN = 0;

  // Stats
  private unsup: Record<string, number> = {};
  private nClip = 0;
  private nFilter = 0;
  private nMultiStop = 0;
  private nStrokeGrad = 0;
  private rmSub = 0;
  private rmShape = 0;
  private rmNodes = 0;
  private nStrokeDrop = 0;

  constructor(options: AlightOptions) {
    this.o = options;
  }

  public run(svgText: string, title: string): AlightResult {
    this.load(svgText);
    this.setupCanvas();
    this.totalMs = Math.round(this.o.duration * 1000);

    const ctx: Record<string, string> = {
      fill: "#000000",
      "fill-opacity": "1",
      "fill-rule": "nonzero",
      stroke: "none",
      "stroke-width": "1",
      "stroke-opacity": "1",
      "stroke-linecap": "butt",
      "stroke-linejoin": "miter",
      color: "#000000",
      visibility: "visible",
    };

    if (!this.root) throw new Error("Root SVG tidak ditemukan.");
    const rootSt = this.nodeStyle(this.root);
    const mergedCtx = this.inherit(ctx, rootSt);
    const op = this.clamp01(this.numAttr(rootSt["opacity"] ?? "1"));
    let tree: any[] = [];
    this.walkChildren(this.root, this.base, mergedCtx, op, tree, 0);

    // Collect layers for inspector
    const all: any[] = [];
    this.collect(tree, all);
    const layers: AlightLayerInfo[] = [];
    for (const it of all) {
      const f = it.fill;
      let color: string | null = null;
      if (f) {
        color = "#" + (f.k === "grad" ? f.s : f.rgb);
      } else if (it.stroke) {
        color = "#" + it.stroke.rgb;
      }
      layers.push({
        i: it.idx,
        name: `Shape_${String(it.idx + 1).padStart(3, "0")}`,
        color,
        grad: Boolean(f && f.k === "grad"),
        stroke: Boolean(it.stroke),
        nodes: this.countNodes(it.subs),
      });
    }

    // Filter by excluded layers and clean small patches
    const excludeSet = new Set(this.o.exclude);
    tree = this.filterTree(tree, excludeSet);
    if (this.o.grouping === "flat") {
      const flat: any[] = [];
      this.collect(tree, flat);
      tree = flat;
    } else {
      tree = this.collapse(tree);
    }

    const shapes: any[] = [];
    this.collect(tree, shapes);
    const stats = this.calcStats(all, shapes);

    let xml = "";
    if (shapes.length > 0) {
      xml = this.emitDocument(tree, title);
    }

    const warnings: string[] = [];
    if (this.nClip > 0) warnings.push(`${this.nClip} elemen memakai clip-path/mask (dirender tanpa clip).`);
    if (this.nFilter > 0) warnings.push(`${this.nFilter} elemen memakai filter (diabaikan).`);
    for (const [t, c] of Object.entries(this.unsup)) {
      warnings.push(`${c} elemen <${t}> dilewati (ubah ke path terlebih dahulu).`);
    }
    if (this.nMultiStop > 0) warnings.push(`${this.nMultiStop} gradient memiliki >2 stop (diambil warna awal & akhir).`);
    if (this.nStrokeGrad > 0) warnings.push(`${this.nStrokeGrad} stroke bergradient (dipakai warna stop pertama).`);
    if (this.rmSub > 0) {
      warnings.push(`Small Patch Cleanup membuang ${this.rmSub} subpath kecil dan ${this.rmShape} shape mikro (${this.rmNodes} node).`);
    }
    if (this.nStrokeDrop > 0) {
      warnings.push(`${this.nStrokeDrop} stroke hairline sewarna fill dibuang.`);
    }
    if (!shapes.length) {
      warnings.push("Tidak ada shape terpilih yang dapat dikonversi.");
    }

    return {
      ok: true,
      src: { w: Number(this.vw.toFixed(2)), h: Number(this.vh.toFixed(2)) },
      canvas: { w: this.cw, h: this.ch },
      fps: this.o.fps,
      duration: this.o.duration,
      grouping: this.o.grouping,
      engine: this.o.engine,
      layers,
      stats,
      warnings,
      xml,
      xmlBytes: new Blob([xml]).size,
    };
  }

  private load(svgText: string): void {
    if (svgText.charCodeAt(0) === 0xfeff) svgText = svgText.slice(1);
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const errorNode = doc.querySelector("parsererror");
    if (errorNode || !doc.documentElement || doc.documentElement.localName.toLowerCase() !== "svg") {
      throw new Error("File bukan SVG yang valid.");
    }
    this.root = doc.documentElement;

    // Collect IDs and styles
    const allElements = this.root.querySelectorAll("*");
    allElements.forEach((el) => {
      const id = el.getAttribute("id");
      if (id) this.ids[id] = el;
      if (el.localName.toLowerCase() === "style" && el.textContent) {
        this.parseCss(el.textContent);
      }
    });

    const vbAttr = this.root.getAttribute("viewBox");
    const vb = vbAttr ? vbAttr.trim().split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (vb.length === 4 && !isNaN(vb[2]) && !isNaN(vb[3]) && vb[2] > 0 && vb[3] > 0) {
      this.vx = vb[0];
      this.vy = vb[1];
      this.vw = vb[2];
      this.vh = vb[3];
    } else {
      const w = this.len(this.root.getAttribute("width") || "");
      const h = this.len(this.root.getAttribute("height") || "");
      this.vx = 0;
      this.vy = 0;
      this.vw = w > 0 ? w : 1024.0;
      this.vh = h > 0 ? h : 1024.0;
    }
  }

  private setupCanvas(): void {
    const p = this.o.preset;
    if (p === "custom") {
      this.cw = this.o.cw;
      this.ch = this.o.ch;
    } else if (SvgToAlightConverter.PRESETS[p]) {
      [this.cw, this.ch] = SvgToAlightConverter.PRESETS[p];
    } else {
      this.cw = Math.max(1, Math.min(8192, Math.round(this.vw)));
      this.ch = Math.max(1, Math.min(8192, Math.round(this.vh)));
      this.base = [1.0, 0.0, 0.0, 1.0, -this.vx, -this.vy];
      return;
    }
    const s = Math.min(this.cw / this.vw, this.ch / this.vh);
    const ox = (this.cw - this.vw * s) / 2 - this.vx * s;
    const oy = (this.ch - this.vh * s) / 2 - this.vy * s;
    this.base = [s, 0.0, 0.0, s, ox, oy];
  }

  private parseCss(css: string): void {
    css = css.replace(/\/\*[\s\S]*?\*\//g, "");
    css = css.replace(/@(?:media|supports|font-face|keyframes)[^{]*\{[^{}]*\{[^{}]*\}[^{}]*\}/gi, "");
    const regex = /([^{}]+)\{([^}]*)\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(css)) !== null) {
      const props = this.parseDecl(match[2]);
      const selectors = match[1].split(",");
      for (let sel of selectors) {
        sel = sel.trim();
        if (sel) {
          const spec = (sel.match(/#/g) || []).length * 10000 + (sel.match(/\./g) || []).length * 100 + (sel.match(/^[a-z]/i) ? 1 : 0);
          this.css.push([sel, props, spec, this.css.length]);
        }
      }
    }
    this.css.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
  }

  private parseDecl(s: string): Record<string, string> {
    const o: Record<string, string> = {};
    for (const d of s.split(";")) {
      const p = d.indexOf(":");
      if (p === -1) continue;
      const k = d.slice(0, p).trim().toLowerCase();
      const v = d.slice(p + 1).replace(/!important/gi, "").trim();
      if (k) o[k] = v;
    }
    return o;
  }

  private nodeStyle(n: Element): Record<string, string> {
    const s: Record<string, string> = {};
    for (const p of SvgToAlightConverter.PROPS) {
      if (n.hasAttribute(p)) {
        s[p] = (n.getAttribute(p) || "").trim();
      }
    }
    if (n.hasAttribute("style")) {
      Object.assign(s, this.parseDecl(n.getAttribute("style") || ""));
    }
    return s;
  }

  private inherit(ctx: Record<string, string>, st: Record<string, string>): Record<string, string> {
    const res = { ...ctx };
    for (const k of SvgToAlightConverter.INHERIT) {
      if (st[k] && st[k] !== "" && st[k] !== "inherit") {
        res[k] = st[k];
      }
    }
    return res;
  }

  private href(n: Element): string {
    return n.getAttribute("href") || n.getAttribute("xlink:href") || "";
  }

  private len(v: string): number {
    const m = /^\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/.exec(v);
    return m ? Number(m[1]) : 0.0;
  }

  private numAttr(v: string): number {
    const trimmed = v.trim();
    if (!trimmed) return 1.0;
    const f = this.len(trimmed);
    return trimmed.endsWith("%") ? f / 100 : f;
  }

  private clamp01(v: number): number {
    return Math.max(0.0, Math.min(1.0, v));
  }

  private walkChildren(p: Node, m: number[], ctx: Record<string, string>, op: number, out: any[], d: number): void {
    p.childNodes.forEach((c) => {
      if (c.nodeType === Node.ELEMENT_NODE) {
        this.walk(c as Element, m, ctx, op, out, d + 1);
      }
    });
  }

  private walk(n: Element, m: number[], ctx: Record<string, string>, op: number, out: any[], d: number): void {
    if (d > 48 || --this.budget < 0) return;
    const tag = n.localName.toLowerCase();
    if (SvgToAlightConverter.SKIP.includes(tag)) return;
    if (["image", "text", "foreignobject", "video"].includes(tag)) {
      this.unsup[tag] = (this.unsup[tag] || 0) + 1;
      return;
    }

    const st = this.nodeStyle(n);
    if (st["display"] === "none") return;
    if (n.hasAttribute("transform")) {
      m = Mat.mul(m, Mat.parse(n.getAttribute("transform") || ""));
    }
    ctx = this.inherit(ctx, st);
    op *= this.clamp01(this.numAttr(st["opacity"] ?? "1"));
    if ((st["clip-path"] ?? "none") !== "none" || (st["mask"] ?? "none") !== "none") this.nClip++;
    if ((st["filter"] ?? "none") !== "none") this.nFilter++;

    switch (tag) {
      case "g":
      case "svg":
      case "a":
      case "switch": {
        const kids: any[] = [];
        this.walkChildren(n, m, ctx, op, kids, d);
        if (kids.length) out.push({ t: "g", name: this.groupName(n), kids });
        return;
      }
      case "use": {
        const targetId = this.href(n).replace(/^#/, "");
        const t = this.ids[targetId];
        if (!t) return;
        const m2 = Mat.mul(m, [1, 0, 0, 1, this.len(n.getAttribute("x") || ""), this.len(n.getAttribute("y") || "")]);
        const kids: any[] = [];
        if (t.localName.toLowerCase() === "symbol") {
          this.walkChildren(t, m2, ctx, op, kids, d + 1);
        } else {
          this.walk(t, m2, ctx, op, kids, d + 1);
        }
        if (kids.length) out.push({ t: "g", name: this.groupName(n), kids });
        return;
      }
      default: {
        const it = this.shape(n, tag, m, ctx, op);
        if (it) out.push(it);
      }
    }
  }

  private groupName(n: Element): string {
    const rawId = (n.getAttribute("id") || "").replace(/[^A-Za-z0-9_]/g, "_").slice(0, 32);
    this.groupN++;
    return rawId ? `Group_${rawId}` : `Group_${this.groupN}`;
  }

  private shape(n: Element, tag: string, m: number[], ctx: Record<string, string>, op: number): any {
    let subs: any[] = [];
    let rect: any = null;

    switch (tag) {
      case "path":
        subs = this.parsePath(n.getAttribute("d") || "");
        break;
      case "rect": {
        const x = this.len(n.getAttribute("x") || "");
        const y = this.len(n.getAttribute("y") || "");
        const w = this.len(n.getAttribute("width") || "");
        const h = this.len(n.getAttribute("height") || "");
        if (w <= 0 || h <= 0) return null;
        let rx = n.hasAttribute("rx") ? this.len(n.getAttribute("rx") || "") : -1;
        let ry = n.hasAttribute("ry") ? this.len(n.getAttribute("ry") || "") : -1;
        if (rx < 0 && ry >= 0) rx = ry;
        if (ry < 0 && rx >= 0) ry = rx;
        rx = Math.max(0, Math.min(rx, w / 2));
        ry = Math.max(0, Math.min(ry, h / 2));
        subs = [this.rectPath(x, y, w, h, rx, ry)];
        rect = { w, h, rx, ry };
        break;
      }
      case "circle": {
        const r = this.len(n.getAttribute("r") || "");
        if (r <= 0) return null;
        subs = [this.ellipsePath(this.len(n.getAttribute("cx") || ""), this.len(n.getAttribute("cy") || ""), r, r)];
        break;
      }
      case "ellipse": {
        const rx = this.len(n.getAttribute("rx") || "");
        const ry = this.len(n.getAttribute("ry") || "");
        if (rx <= 0 || ry <= 0) return null;
        subs = [this.ellipsePath(this.len(n.getAttribute("cx") || ""), this.len(n.getAttribute("cy") || ""), rx, ry)];
        break;
      }
      case "line": {
        subs = [[
          ["M", this.len(n.getAttribute("x1") || ""), this.len(n.getAttribute("y1") || "")],
          ["L", this.len(n.getAttribute("x2") || ""), this.len(n.getAttribute("y2") || "")],
        ]];
        break;
      }
      case "polyline":
      case "polygon": {
        const pm = (n.getAttribute("points") || "").match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g);
        if (!pm || pm.length < 4) return null;
        const v = pm.map(Number);
        const sub: any[] = [];
        for (let i = 0; i + 1 < v.length; i += 2) {
          sub.push([i === 0 ? "M" : "L", v[i], v[i + 1]]);
        }
        if (tag === "polygon") sub.push(["Z"]);
        subs = [sub];
        break;
      }
      default:
        return null;
    }

    subs = subs.filter((s) => s.length >= 2);
    if (!subs.length) return null;
    if (["hidden", "collapse"].includes(ctx["visibility"] || "visible")) return null;

    const t = this.xform(subs, m);
    const bb = this.bbox(t);

    // Fill
    let fillSpec: any = null;
    const fp = tag === "line" ? { k: "none" } : this.paint(ctx["fill"] || "#000000", ctx["color"] || "#000000");
    const fo = this.clamp01(this.numAttr(ctx["fill-opacity"] || "1")) * op;

    if (fp.k === "solid") {
      fillSpec = { k: "solid", rgb: fp.rgb, a: fp.a * fo };
    } else if (fp.k === "url") {
      const g = this.gradient(fp.id);
      if (g) {
        fillSpec = this.gradSpec(g, m, bb, fo);
      }
    }

    // Stroke
    let strokeSpec: any = null;
    const sp = this.paint(ctx["stroke"] || "none", ctx["color"] || "#000000");
    if (sp.k !== "none") {
      const sw = this.len(ctx["stroke-width"] || "1") * Math.sqrt(Math.abs(Mat.det(m)));
      const so = this.clamp01(this.numAttr(ctx["stroke-opacity"] || "1")) * op;
      let rgb: string | null = null;
      let a = 1.0;
      if (sp.k === "solid") {
        rgb = sp.rgb;
        a = sp.a;
      } else {
        const g = this.gradient(sp.id);
        if (g && g.stops.length > 0) {
          rgb = g.stops[0][1];
          a = g.stops[0][2];
          this.nStrokeGrad++;
        }
      }
      if (rgb && sw > 0) {
        strokeSpec = {
          rgb,
          a: a * so,
          w: sw,
          cap: ctx["stroke-linecap"] || "butt",
          join: ctx["stroke-linejoin"] || "miter",
        };
      }
    }

    // Hairline stroke removal
    if (
      this.o.cstroke &&
      fillSpec &&
      fillSpec.k === "solid" &&
      strokeSpec &&
      strokeSpec.rgb === fillSpec.rgb &&
      strokeSpec.w <= 2.5
    ) {
      strokeSpec = null;
      this.nStrokeDrop++;
    }

    if (fillSpec && fillSpec.k === "solid" && fillSpec.a <= 0.004 && !strokeSpec) return null;
    if (!fillSpec && !strokeSpec) return null;

    let prim: any = null;
    if (
      rect &&
      fillSpec &&
      fillSpec.k === "solid" &&
      !strokeSpec &&
      Math.abs(m[1]) < 1e-9 &&
      Math.abs(m[2]) < 1e-9 &&
      rect.rx === 0 &&
      rect.ry === 0
    ) {
      prim = { w: rect.w * Math.abs(m[0]), h: rect.h * Math.abs(m[3]), r: rect.rx * Math.abs(m[0]) };
    }

    return {
      t: "s",
      idx: this.idx++,
      tag,
      subs: t,
      bb,
      fill: fillSpec,
      stroke: strokeSpec,
      prim,
    };
  }

  private paint(v: string, color: string): any {
    v = v.trim();
    if (!v || v === "none" || v === "transparent") return { k: "none" };
    const urlMatch = /^url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)\s*(.*)$/i.exec(v);
    if (urlMatch) {
      return { k: "url", id: urlMatch[1], fallback: urlMatch[2]?.trim() || "" };
    }
    if (v.toLowerCase() === "currentcolor") v = color;
    const c = this.color(v);
    return c ? { k: "solid", rgb: c[0], a: c[1] } : { k: "none" };
  }

  private color(v: string): [string, number] | null {
    v = v.toLowerCase().trim();
    if (v.startsWith("#")) {
      let h = v.slice(1);
      if (h.length === 3 || h.length === 4) {
        h = h.split("").map((c) => c + c).join("");
      }
      if (h.length === 6) return [h.toUpperCase(), 1.0];
      if (h.length === 8) return [h.slice(0, 6).toUpperCase(), parseInt(h.slice(6, 8), 16) / 255];
      return null;
    }
    const rgbMatch = /^rgba?\(([^)]+)\)$/.exec(v);
    if (rgbMatch) {
      const p = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
      if (p.length < 3) return null;
      const c = p.slice(0, 3).map((val) => {
        const x = val.endsWith("%") ? Number(val.slice(0, -1)) * 2.55 : Number(val);
        return Math.max(0, Math.min(255, Math.round(x)));
      });
      let a = 1.0;
      if (p[3]) {
        a = p[3].endsWith("%") ? Number(p[3].slice(0, -1)) / 100 : Number(p[3]);
      }
      const hex = c.map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
      return [hex, this.clamp01(a)];
    }
    return ["000000", 1.0];
  }

  private gradient(id: string): any {
    const node = this.ids[id];
    if (!node) return null;
    const kind = node.localName.toLowerCase();
    if (kind !== "lineargradient" && kind !== "radialgradient") return null;

    const stops: [number, string, number][] = [];
    node.querySelectorAll("stop").forEach((s) => {
      const st = this.nodeStyle(s);
      const off = s.hasAttribute("offset") ? this.numAttr(s.getAttribute("offset") || "0") : 0.0;
      const col = this.color(st["stop-color"] || "#000000") || ["000000", 1.0];
      const opacity = this.numAttr(st["stop-opacity"] || "1");
      stops.push([this.clamp01(off), col[0], col[1] * this.clamp01(opacity)]);
    });

    if (!stops.length) return null;
    const obb = (node.getAttribute("gradientUnits") || "objectBoundingBox") !== "userSpaceOnUse";
    const gt = Mat.parse(node.getAttribute("gradientTransform") || "");

    const pc = (val: string, ref: number): number => {
      const f = this.len(val);
      return val.trim().endsWith("%") ? (obb ? f / 100 : (f / 100) * ref) : f;
    };

    if (kind === "lineargradient") {
      return {
        type: "linear",
        stops,
        obb,
        gt,
        p1: [pc(node.getAttribute("x1") || "0%", this.vw), pc(node.getAttribute("y1") || "0%", this.vh)],
        p2: [pc(node.getAttribute("x2") || "100%", this.vw), pc(node.getAttribute("y2") || "0%", this.vh)],
      };
    }
    const cx = pc(node.getAttribute("cx") || "50%", this.vw);
    const cy = pc(node.getAttribute("cy") || "50%", this.vh);
    const diag = Math.sqrt((this.vw ** 2 + this.vh ** 2) / 2);
    const r = pc(node.getAttribute("r") || "50%", diag);
    return {
      type: "radial",
      stops,
      obb,
      gt,
      p1: [cx, cy],
      p2: [cx + r, cy],
    };
  }

  private gradSpec(g: any, m: number[], bb: number[], fo: number): any {
    const n = g.stops.length;
    if (n === 1) return { k: "solid", rgb: g.stops[0][1], a: g.stops[0][2] * fo };
    if (n > 2) this.nMultiStop++;

    const to = (p: [number, number]): [number, number] => {
      const [x, y] = Mat.apply(g.gt, p[0], p[1]);
      if (g.obb) {
        return [bb[0] + x * (bb[2] - bb[0]), bb[1] + y * (bb[3] - bb[1])];
      }
      return Mat.apply(m, x, y);
    };

    const a = g.stops[0];
    const b = g.stops[n - 1];
    return {
      k: "grad",
      type: g.type,
      c1: to(g.p1),
      c2: to(g.p2),
      s: a[1],
      sa: a[2] * fo,
      e: b[1],
      ea: b[2] * fo,
    };
  }

  private rectPath(x: number, y: number, w: number, h: number, r: number, s: number): any[] {
    if (r <= 0 || s <= 0) {
      return [["M", x, y], ["L", x + w, y], ["L", x + w, y + h], ["L", x, y + h], ["Z"]];
    }
    const k = SvgToAlightConverter.KAPPA;
    const x2 = x + w;
    const y2 = y + h;
    return [
      ["M", x + r, y],
      ["L", x2 - r, y],
      ["C", x2 - r + k * r, y, x2, y + s - k * s, x2, y + s],
      ["L", x2, y2 - s],
      ["C", x2, y2 - s + k * s, x2 - r + k * r, y2, x2 - r, y2],
      ["L", x + r, y2],
      ["C", x + r - k * r, y2, x, y2 - s + k * s, x, y2 - s],
      ["L", x, y + s],
      ["C", x, y + s - k * s, x + r - k * r, y, x + r, y],
      ["Z"],
    ];
  }

  private ellipsePath(cx: number, cy: number, rx: number, ry: number): any[] {
    const k = SvgToAlightConverter.KAPPA;
    return [
      ["M", cx + rx, cy],
      ["C", cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry],
      ["C", cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy],
      ["C", cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry],
      ["C", cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy],
      ["Z"],
    ];
  }

  private parsePath(d: string): any[] {
    const len = d.length;
    let i = 0;
    const subs: any[] = [];
    let k = -1;
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let cmd = "";

    const skip = () => {
      while (i < len && " ,\t\r\n".includes(d[i])) i++;
    };

    const num = (): number | null => {
      skip();
      const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i));
      if (!m) return null;
      i += m[0].length;
      return Number(m[0]);
    };

    const begin = () => {
      if (k < 0) {
        subs.push([["M", x, y]]);
        k = subs.length - 1;
        sx = x;
        sy = y;
      }
    };

    while (i < len) {
      skip();
      if (i >= len) break;
      const c = d[i];
      if (/[a-zA-Z]/.test(c)) {
        cmd = c;
        i++;
        if (cmd === "Z" || cmd === "z") {
          if (k >= 0) subs[k].push(["Z"]);
          x = sx;
          y = sy;
          k = -1;
          continue;
        }
      }

      const rel = cmd === cmd.toLowerCase();
      const C = cmd.toUpperCase();
      const bx = rel ? x : 0.0;
      const by = rel ? y : 0.0;

      switch (C) {
        case "M": {
          const nx = num();
          const ny = num();
          if (nx === null || ny === null) break;
          x = bx + nx;
          y = by + ny;
          subs.push([["M", x, y]]);
          k = subs.length - 1;
          sx = x;
          sy = y;
          cmd = rel ? "l" : "L";
          break;
        }
        case "L": {
          const nx = num();
          const ny = num();
          if (nx === null || ny === null) break;
          begin();
          x = bx + nx;
          y = by + ny;
          subs[k].push(["L", x, y]);
          break;
        }
        case "H": {
          const nx = num();
          if (nx === null) break;
          begin();
          x = bx + nx;
          subs[k].push(["L", x, y]);
          break;
        }
        case "V": {
          const ny = num();
          if (ny === null) break;
          begin();
          y = by + ny;
          subs[k].push(["L", x, y]);
          break;
        }
        case "C": {
          const a = [num(), num(), num(), num(), num(), num()];
          if (a.includes(null)) break;
          begin();
          const c1x = bx + a[0]!;
          const c1y = by + a[1]!;
          const c2x = bx + a[2]!;
          const c2y = by + a[3]!;
          x = bx + a[4]!;
          y = by + a[5]!;
          subs[k].push(["C", c1x, c1y, c2x, c2y, x, y]);
          break;
        }
        default:
          i++;
          break;
      }
    }
    return subs.filter((s) => s.length >= 2);
  }

  private xform(subs: any[], m: number[]): any[] {
    return subs.map((sub) =>
      sub.map((s: any) => {
        if (s[0] === "Z") return s;
        const r: any[] = [s[0]];
        for (let i = 1; i + 1 < s.length; i += 2) {
          const [px, py] = Mat.apply(m, s[i], s[i + 1]);
          r.push(px, py);
        }
        return r;
      })
    );
  }

  private bbox(subs: any[]): [number, number, number, number] {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    const ext = (x: number, y: number) => {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    };
    for (const sub of subs) {
      for (const s of sub) {
        if (s[0] === "M" || s[0] === "L") {
          ext(s[1], s[2]);
        } else if (s[0] === "C") {
          ext(s[1], s[2]);
          ext(s[3], s[4]);
          ext(s[5], s[6]);
        }
      }
    }
    return isFinite(x0) ? [x0, y0, x1, y1] : [0, 0, 0, 0];
  }

  private countNodes(subs: any[]): number {
    return subs.reduce((sum, s) => sum + s.length, 0);
  }

  private collect(nodes: any[], out: any[]): void {
    for (const n of nodes) {
      if (n.t === "g") {
        this.collect(n.kids, out);
      } else {
        out.push(n);
      }
    }
  }

  private filterTree(nodes: any[], exclude: Set<number>): any[] {
    const out: any[] = [];
    for (let n of nodes) {
      if (n.t === "g") {
        const kids = this.filterTree(n.kids, exclude);
        if (kids.length) out.push({ ...n, kids });
        continue;
      }
      if (exclude.has(n.idx)) continue;
      if (!this.o.prim) n.prim = null;
      out.push(n);
    }
    return out;
  }

  private collapse(nodes: any[]): any[] {
    const out: any[] = [];
    for (const n of nodes) {
      if (n.t === "g") {
        const k = this.collapse(n.kids);
        if (!k.length) continue;
        if (k.length === 1) {
          out.push(k[0]);
          continue;
        }
        out.push({ ...n, kids: k });
      } else {
        out.push(n);
      }
    }
    return out;
  }

  private calcStats(all: any[], sel: any[]): AlightStats {
    const paints = new Set<string>();
    let grad = 0,
      stroke = 0,
      prim = 0;
    for (const it of sel) {
      const f = it.fill;
      if (f) {
        if (f.k === "grad") {
          grad++;
          paints.add(`g_${f.type}_${f.s}_${f.e}`);
        } else {
          paints.add(`s_${f.rgb}`);
        }
      }
      if (it.stroke) {
        stroke++;
        paints.add(`k_${it.stroke.rgb}`);
      }
      if (it.prim) prim++;
    }
    return {
      total: all.length,
      selected: sel.length,
      colors: paints.size,
      gradients: grad,
      strokes: stroke,
      clips: this.nClip,
      primitives: prim,
      removedSub: this.rmSub,
      removedShape: this.rmShape,
      removedNodes: this.rmNodes,
    };
  }

  /* ───────────────────────── XML Emission ───────────────────────── */
  private f6(v: number): string {
    return isFinite(v) ? v.toFixed(6) : "0.000000";
  }

  private n(v: number): string {
    if (!isFinite(v)) return "0";
    const s = v.toFixed(4).replace(/\.?0+$/, "");
    return s === "" || s === "-0" ? "0" : s;
  }

  private argb(rgb: string, a: number): string {
    const alpha = Math.round(this.clamp01(a) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    return `#${alpha}${rgb.toUpperCase()}`;
  }

  private sceneOpen(title: string, root = true): string {
    const now = root ? String(Date.now()) : "0";
    return `<scene title="${root ? title : ""}" width="${this.cw}" height="${this.ch}" exportWidth="${this.cw}" exportHeight="${this.ch}" precompose="dynamicResolution" bgcolor="#00000000" totalTime="${this.totalMs}" fps="${this.o.fps}" modifiedTime="${now}" amver="${AM_BUILD}" ffver="${AM_FFVER}" am="${AM_STRING}" amplatform="android" retime="${root ? "freeze" : "off"}" retimeAdaptFPS="false">`;
  }

  private emitDocument(tree: any[], title: string): string {
    this.nextId = 1;
    let x = `<?xml version='1.0' encoding='UTF-8' ?>\n<!-- Alight Motion XML Export [Fixio Vector Engine] -->\n`;
    x += this.sceneOpen(title, true) + "\n";
    if (this.o.grouping === "nested") {
      x += this.embed("SVG Lossless Layer", this.emitNodes(tree, 3), 1);
    } else {
      x += this.emitNodes(tree, 1);
    }
    x += "</scene>\n";
    return x;
  }

  private emitNodes(nodes: any[], lvl: number): string {
    let o = "";
    for (const n of nodes) {
      if (n.t === "g") {
        o += this.embed(n.name, this.emitNodes(n.kids, lvl + 2), lvl);
      } else {
        o += this.emitShape(n, lvl);
      }
    }
    return o;
  }

  private embed(label: string, inner: string, lvl: number): string {
    const id = this.nextId++;
    const p = "  ".repeat(lvl);
    const T = this.totalMs;
    const cleanLabel = label.replace(/[^\x20-\x7E]/g, "_") || "Group";
    let s = `${p}<embedScene id="${id}" label="${cleanLabel}" startTime="0" endTime="${T}" fillType="intrinsic" outTime="${T}" mediaFillMode="fill">\n`;
    s += `${p}  <transform>\n${p}    <location value="${this.f6(this.cw / 2)},${this.f6(this.ch / 2)},0.000000" />\n${p}  </transform>\n`;
    s += `${p}  <fillColor value="#FF000000" />\n`;
    s += `${p}  ${this.sceneOpen("", false)}\n${inner}${p}  </scene>\n`;
    s += `${p}</embedScene>\n`;
    return s;
  }

  private emitShape(it: any, lvl: number): string {
    const id = this.nextId++;
    const p = "  ".repeat(lvl);
    const T = this.totalMs;
    const bb = it.bb;
    const f = it.fill;
    const isGrad = f && f.k === "grad";
    const tag = (it.tag || "path").toLowerCase();

    const fillType = isGrad ? "gradient" : f ? "color" : "none";
    let attrs = `id="${id}" label="${tag} ${it.idx}" startTime="0" endTime="${T}" fillType="${fillType}"`;
    if (it.prim) attrs += ' s=".rect"';
    attrs += ' mediaFillMode="fill"';

    const lx = it.prim ? (bb[0] + bb[2]) / 2 : this.cw / 2;
    const ly = it.prim ? (bb[1] + bb[3]) / 2 : this.ch / 2;

    let o = `${p}<shape ${attrs}>\n`;
    o += `${p}  <transform>\n${p}    <location value="${this.f6(lx)},${this.f6(ly)},0.000000" />\n${p}  </transform>\n`;

    if (isGrad) {
      o += `${p}  <fillColor value="${this.argb(f.s, f.sa)}" />\n`;
      const nw = Math.max(bb[2] - bb[0], 1e-6);
      const nh = Math.max(bb[3] - bb[1], 1e-6);
      o += `${p}  <gradient type="${f.type}" startColor="${this.argb(f.s, f.sa)}" endColor="${this.argb(f.e, f.ea)}" start="${this.f6((f.c1[0] - bb[0]) / nw)},${this.f6((f.c1[1] - bb[1]) / nh)}" end="${this.f6((f.c2[0] - bb[0]) / nw)},${this.f6((f.c2[1] - bb[1]) / nh)}" />\n`;
    } else if (f) {
      o += `${p}  <fillColor value="${this.argb(f.rgb, f.a)}" />\n`;
    } else if (it.stroke) {
      o += `${p}  <fillColor value="${this.argb(it.stroke.rgb, it.stroke.a)}" />\n`;
    } else {
      o += `${p}  <fillColor value="#00000000" />\n`;
    }

    if (it.stroke) {
      const s = it.stroke;
      const join = ["round", "bevel"].includes(s.join) ? s.join : "miter";
      o += `${p}  <path-stroke direction="centered" join="${join}" end-size="1.500000">\n`;
      o += `${p}    <color value="${this.argb(s.rgb, s.a)}" />\n`;
      o += `${p}    <size value="${this.f6(s.w)}" />\n`;
      o += `${p}  </path-stroke>\n`;
    }

    if (it.prim) {
      o += `${p}  <property name="size" type="vec2" value="${this.f6(it.prim.w)},${this.f6(it.prim.h)}" />\n`;
    } else {
      o += `${p}  <path d="${this.pathD(it.subs, lx, ly)}" />\n`;
    }
    o += `${p}</shape>\n`;
    return o;
  }

  private pathD(subs: any[], cx: number, cy: number): string {
    let out = "";
    for (const sub of subs) {
      for (const s of sub) {
        if (s[0] === "M" || s[0] === "L") {
          out += `${s[0]} ${this.n(s[1] - cx)} ${this.n(s[2] - cy)} `;
        } else if (s[0] === "C") {
          out += `C ${this.n(s[1] - cx)} ${this.n(s[2] - cy)}, ${this.n(s[3] - cx)} ${this.n(s[4] - cy)}, ${this.n(s[5] - cx)} ${this.n(s[6] - cy)} `;
        } else if (s[0] === "Z") {
          out += "Z ";
        }
      }
    }
    return out.trim();
  }
}
