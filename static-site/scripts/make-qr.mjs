// SPDX-License-Identifier: AGPL-3.0-only
//
// Plain, print-ready QR code (SVG, real size in mm), tuned to stay scannable
// when printed TINY (e.g. on giveaways):
//   - shortest possible content: use a short redirect path (vercel.json,
//     e.g. /K) instead of the long UTM URL
//   - ALL CAPS content is encoded in alphanumeric mode (5.5 instead of 8 bits
//     per character) → fewer modules → bigger modules at the same print size
//   - plain black squares on white, 4-module quiet zone (spec), no logo
//
//   node scripts/make-qr.mjs <TEXT> <out.svg> [--mm 15] [--ec M]
//
// --mm is the total width INCLUDING the white quiet zone.

import { writeFileSync } from "node:fs";
import qrcode from "qrcode-generator";

const args = process.argv.slice(2);
const opt = (name, d) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : d;
};
const [text, out] = args;
const MM = Number(opt("--mm", "15"));
const EC = opt("--ec", "M");
if (!text || !out) {
  console.error("usage: node scripts/make-qr.mjs <TEXT> <out.svg> [--mm 15] [--ec M]");
  process.exit(1);
}

const alnum = /^[0-9A-Z $%*+\-./:]+$/.test(text);
const qr = qrcode(0, EC);
qr.addData(text, alnum ? "Alphanumeric" : "Byte");
qr.make();
const n = qr.getModuleCount();
const QUIET = 4;
const size = n + 2 * QUIET;

let d = "";
for (let r = 0; r < n; r++)
  for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`;

writeFileSync(
  out,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MM}mm" height="${MM}mm" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
<rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/>
</svg>
`,
);
console.log(
  `${out}: ${alnum ? "alphanumeric" : "byte"} mode, EC ${EC}, ${n}×${n} modules, ` +
    `${(MM / size).toFixed(2)} mm/module at ${MM} mm total (code ${((MM / size) * n).toFixed(1)} mm)`,
);
