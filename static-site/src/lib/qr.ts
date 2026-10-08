// SPDX-License-Identifier: AGPL-3.0-only
import qrcode from "qrcode-generator";

export interface QrMatrix {
  /** Modules per side (without quiet zone). */
  size: number;
  /** SVG path data, one 1×1 square per dark module, offset by the quiet zone. */
  path: string;
}

/** Quiet zone in modules — the QR spec asks for 4. */
export const QR_MARGIN = 4;

/**
 * Encode `text` as a QR code and return it as a single SVG path. Rendering as
 * React SVG (instead of the library's HTML string) keeps us free of
 * dangerouslySetInnerHTML. Error correction "M" leaves headroom for screens
 * with glare while keeping ?r= result links at a scannable size.
 */
export function qrMatrix(text: string): QrMatrix {
  const qr = qrcode(0, "M");
  qr.addData(text, "Byte");
  qr.make();
  const size = qr.getModuleCount();
  let path = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (qr.isDark(row, col)) path += `M${col + QR_MARGIN} ${row + QR_MARGIN}h1v1h-1z`;
    }
  }
  return { size, path };
}
