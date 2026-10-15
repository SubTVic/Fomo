// SPDX-License-Identifier: AGPL-3.0-only
//
// Fit + export the condom artwork: trims the empty margin so the outermost
// element (ring text / plug) touches the 50 × 50 mm edge — everything incl.
// the QR code scales up — then writes PDF (print), 600 dpi PNG and a preview.
//
//   node export.mjs <dir> navy pink gold weiss      (needs playwright)
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const [dir, ...variants] = process.argv.slice(2);
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const file = (v) => `${dir}/fomo-kondom-${v}.svg`;

// 1) fit: square viewBox tight around the artwork
for (const v of variants) {
  let svg = readFileSync(file(v), "utf8");
  const p = await b.newPage();
  await p.setContent(svg);
  const bb = await p.evaluate(() => {
    // exact extents: sample points along every outline (a rotated element's
    // bounding box would overestimate), mapped into the svg's coordinates
    const s = document.querySelector("svg");
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of s.querySelectorAll("path, rect")) {
      const toRoot = s.getScreenCTM().inverse().multiply(el.getScreenCTM());
      const pts = [];
      if (el.tagName === "rect") {
        const r = el.getBBox();
        pts.push([r.x, r.y], [r.x + r.width, r.y + r.height]);
      } else {
        const len = el.getTotalLength();
        const n = Math.min(20000, Math.max(200, Math.ceil(len / 2)));
        for (let i = 0; i <= n; i++) { const q = el.getPointAtLength((len * i) / n); pts.push([q.x, q.y]); }
      }
      for (const [x, y] of pts) {
        const q = new DOMPoint(x, y).matrixTransform(toRoot);
        x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y);
      }
    }
    return { x0, y0, x1, y1 };
  });
  await p.close();
  // centre on the artwork itself so both axes use the full width
  const STROKE = 3; // ring/icon outline half-widths are not in the outline points
  const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
  const half = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) / 2 + STROKE;
  svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${(cx - half).toFixed(2)} ${(cy - half).toFixed(2)} ${(2 * half).toFixed(2)} ${(2 * half).toFixed(2)}"`);
  writeFileSync(file(v), svg);
  console.log(v, `QR now ${((200 * 250) / half / 10).toFixed(1)} mm, artwork ${((bb.x1 - bb.x0) * 250 / half / 10).toFixed(1)} × ${((bb.y1 - bb.y0) * 250 / half / 10).toFixed(1)} mm`);
}

// 2) PDF + 600 dpi PNG
for (const v of variants) {
  const svg = readFileSync(file(v), "utf8");
  const p = await b.newPage();
  await p.setContent(`<style>@page{size:50mm 50mm;margin:0}html,body{margin:0}</style>${svg}`);
  await p.pdf({ path: `${dir}/fomo-kondom-${v}.pdf`, width: "50mm", height: "50mm", printBackground: true, pageRanges: "1" });
  const q = await b.newPage({ viewport: { width: 1181, height: 1181 } });
  await q.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg.replace('width="50mm" height="50mm"', 'width="1181" height="1181"')}`);
  await q.locator("svg").screenshot({ path: `${dir}/fomo-kondom-${v}.png`, omitBackground: true });
  await p.close(); await q.close();
}

// 3) 2×2 preview on blue foil (the dashed square = 50 × 50 mm print area)
const tile = (v) => `<div style="width:460px;height:460px;border-radius:14px;background:linear-gradient(135deg,#a3c7de,#7fa7c4 55%,#b2d2e6);box-shadow:0 8px 30px #0003,inset 0 0 0 10px #8fb3cc;display:grid;place-items:center"><div style="width:400px;height:400px;outline:1px dashed #fff8">${readFileSync(file(v), "utf8").replace('width="50mm" height="50mm"', 'width="100%" height="100%"')}</div></div>`;
const m = await b.newPage({ viewport: { width: 1040, height: 1040 } });
await m.setContent(`<body style="margin:0;background:#a6cbe0;display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:40px;box-sizing:border-box;height:100vh">${variants.slice(0, 4).map(tile).join("")}</body>`);
await m.screenshot({ path: `${dir}/vorschau.png` });
await b.close();
