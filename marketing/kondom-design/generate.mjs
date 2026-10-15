// SPDX-License-Identifier: AGPL-3.0-only
//
// FOMO condom-wrapper artwork (50 × 50 mm, vector, print-ready).
// Real, scannable QR code (EC "H" = 30 % redundancy, so the "FOMO" label in
// the middle is safe), all text converted to outlines (no fonts needed at the
// print shop). 1 SVG unit = 0.1 mm.
//
// Icons: icons/stecker.json, icons/dose.json (traced from the *-vorlage.jpg).
//   npm i opentype.js@1.3.4 @fontsource/archivo-black@5.0.19 @fontsource/lexend@5.0.21 qrcode-generator@2.0.4
//   node generate.mjs <out-dir> [label-color] [variant-name]
import { writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const qrcode = require("qrcode-generator");

const [outDir = ".", labelColor = "#1a2a35", variant = "navy"] = process.argv.slice(2);
const hearts = "hearts";
const font = (p) => { const b = readFileSync(require.resolve(p)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const HEAD = font("@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff");
const BODY = font("@fontsource/lexend/files/lexend-latin-700-normal.woff");

const NAVY = "#1a2a35", WHITE = "#ffffff";
const W = 500, C = 250;
const URL = "HTTPS://WWW.FOMO-DRESDEN.APP/K";

// --- text on a circle (glyph outlines) -------------------------------------
function arcText(str, f, size, r, centerDeg, { inside = false, spacing = 0 } = {}) {
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(str);
  const widths = glyphs.map((g) => g.advanceWidth * scale + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  // top text runs clockwise (reads left→right), bottom text counter-clockwise
  const dir = inside ? -1 : 1;
  let a = centerDeg - dir * (total / 2 / r) * (180 / Math.PI);
  let d = "";
  glyphs.forEach((g, i) => {
    const w = widths[i] - spacing;
    const mid = a + dir * ((w / 2) / r) * (180 / Math.PI);
    const rad = (mid * Math.PI) / 180;
    const x = C + r * Math.sin(rad), y = C - r * Math.cos(rad);
    const rot = inside ? mid + 180 : mid;
    const p = g.getPath(-w / 2, inside ? size * 0.72 : 0, size);
    const tr = (px, py) => {
      const t = (rot * Math.PI) / 180;
      return [x + px * Math.cos(t) - py * Math.sin(t), y + px * Math.sin(t) + py * Math.cos(t)];
    };
    for (const c of p.commands) {
      if (c.type === "M" || c.type === "L") { const [X, Y] = tr(c.x, c.y); d += `${c.type}${X.toFixed(2)} ${Y.toFixed(2)}`; }
      else if (c.type === "Q") { const [a1, b1] = tr(c.x1, c.y1), [X, Y] = tr(c.x, c.y); d += `Q${a1.toFixed(2)} ${b1.toFixed(2)} ${X.toFixed(2)} ${Y.toFixed(2)}`; }
      else if (c.type === "C") { const [a1, b1] = tr(c.x1, c.y1), [a2, b2] = tr(c.x2, c.y2), [X, Y] = tr(c.x, c.y); d += `C${a1.toFixed(2)} ${b1.toFixed(2)} ${a2.toFixed(2)} ${b2.toFixed(2)} ${X.toFixed(2)} ${Y.toFixed(2)}`; }
      else if (c.type === "Z") d += "Z";
    }
    a += dir * (widths[i] / r) * (180 / Math.PI);
  });
  return { d, span: (total / r) * (180 / Math.PI) };
}

// --- QR --------------------------------------------------------------------
const qr = qrcode(0, "H");
qr.addData(URL, "Alphanumeric");
qr.make();
const n = qr.getModuleCount();
const QPX = 200;                 // QR width in units (20 mm)
const m = QPX / n;               // module size
const PLATE = QPX + 8 * m;       // white plate incl. 4-module quiet zone
const qx = C - QPX / 2, qy = C - QPX / 2;

// centre label (Archivo Black "FOMO") on a white pill
const LABEL_SIZE = 22;
const lp = HEAD.getPath("FOMO", 0, 0, LABEL_SIZE);
const bb = lp.getBoundingBox();
const lw = bb.x2 - bb.x1, lh = bb.y2 - bb.y1;
const padX = m * 1.2, padY = m * 1.0;
const pill = { w: lw + 2 * padX, h: lh + 2 * padY };
const pillX = C - pill.w / 2, pillY = C - pill.h / 2;
const labelPath = HEAD.getPath("FOMO", C - lw / 2 - bb.x1, C - lh / 2 - bb.y1, LABEL_SIZE).toPathData(2);
const inPill = (r, c) => {
  const x0 = qx + c * m, y0 = qy + r * m;
  return x0 + m > pillX - m * 0.3 && x0 < pillX + pill.w + m * 0.3 && y0 + m > pillY - m * 0.3 && y0 < pillY + pill.h + m * 0.3;
};
const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

let mods = "";
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
  if (!qr.isDark(r, c) || inFinder(r, c) || inPill(r, c)) continue;
  mods += `M${(qx + c * m).toFixed(3)} ${(qy + r * m).toFixed(3)}h${m.toFixed(3)}v${m.toFixed(3)}h-${m.toFixed(3)}z`;
}
// heart path in a unit box (0..1)
const HEART = (x, y, s) => {
  const p = (u, v) => `${(x + u * s).toFixed(2)} ${(y + v * s).toFixed(2)}`;
  return `M${p(0.5, 0.97)}C${p(0.2, 0.75)} ${p(-0.02, 0.55)} ${p(0.02, 0.3)}C${p(0.06, 0.08)} ${p(0.36, 0.02)} ${p(0.5, 0.24)}C${p(0.64, 0.02)} ${p(0.94, 0.08)} ${p(0.98, 0.3)}C${p(1.02, 0.55)} ${p(0.8, 0.75)} ${p(0.5, 0.97)}Z`;
};
const finder = (r, c) => {
  const x = qx + c * m, y = qy + r * m;
  const ring = `M${x} ${y}h${7 * m}v${7 * m}h${-7 * m}z M${x + m} ${y + m}v${5 * m}h${5 * m}v${-5 * m}z`;
  const eye = hearts === "hearts"
    ? HEART(x + 1.5 * m, y + 1.45 * m, 4.0 * m)
    : `M${x + 2 * m} ${y + 2 * m}h${3 * m}v${3 * m}h${-3 * m}z`;
  return `<path fill-rule="evenodd" d="${ring}"/><path d="${eye}"/>`;
};

// --- ring, icons, text -----------------------------------------------------
const R = 196;
const top = arcText("FOMO-DRESDEN.APP", HEAD, 27, R - 9, 0, { spacing: 1.2 });
const bottom = arcText("CONNECT WITH THE RIGHT PEOPLE", BODY, 21, R - 6, 180, { inside: true, spacing: 0.6 });
const gap = 4; // degrees of air between text and ring line
const arc = (from, to) => {
  const p = (deg) => [C + R * Math.sin((deg * Math.PI) / 180), C - R * Math.cos((deg * Math.PI) / 180)];
  const [x1, y1] = p(from), [x2, y2] = p(to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};
const tEnd = top.span / 2 + gap;
// right side: top text end → plug (90°) ; left side: socket (270°) → top text start
const ringRight = arc(tEnd, 70);
const ringLeft = arc(290, 360 - top.span / 2 - gap);
// plug + socket: hand-drawn icons (icons/*-vorlage.jpg), traced to vector
// paths with potrace (icons/*.json). Both hang from the ring on their cable.
const here = dirname(fileURLToPath(import.meta.url)) + "/";
const icon = (name) => JSON.parse(readFileSync(`${here}icons/${name}.json`, "utf8"));
const ICON_SCALE = 0.125; // 1 px of the drawing → 0.0125 mm (lines ≈ 0.3 mm)
const placeIcon = (name, cx, cy, rot) => {
  const o = icon(name);
  return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${ICON_SCALE}) translate(${-o.w / 2} ${-o.h / 2})"><path fill="${NAVY}" fill-rule="evenodd" d="${o.d}"/></g>`;
};
const plug = (cx, cy) => placeIcon("stecker", cx, cy, 135);
const socket = (cx, cy) => placeIcon("dose", cx, cy, -90);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 ${W} ${W}">
<title>FOMO Kondom – ${URL}</title>
<path d="${ringRight}${ringLeft}" fill="none" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/>
${plug(C + R, C + 22)}
${socket(C - R, C + 22)}
<path d="${top.d}" fill="${NAVY}"/>
<path d="${bottom.d}" fill="${WHITE}" stroke="${NAVY}" stroke-width="0.8" paint-order="stroke"/>
<rect x="${C - PLATE / 2}" y="${C - PLATE / 2}" width="${PLATE}" height="${PLATE}" rx="${2 * m}" fill="${WHITE}"/>
<g fill="${NAVY}"><path d="${mods}"/>${finder(0, 0)}${finder(0, n - 7)}${finder(n - 7, 0)}</g>
<rect x="${pillX}" y="${pillY}" width="${pill.w}" height="${pill.h}" rx="${m}" fill="${labelColor.toLowerCase() === "#ffffff" ? NAVY : WHITE}"/>
<path d="${labelPath}" fill="${labelColor}"/>
</svg>
`;
const name = `${outDir}/fomo-kondom-${variant}.svg`;
writeFileSync(name, svg);
console.log(name, `QR v${(n - 17) / 4} ${n}×${n}, ${(m / 10).toFixed(2)} mm/module, label covers ~${((pill.w * pill.h) / (QPX * QPX) * 100).toFixed(1)} %`);
