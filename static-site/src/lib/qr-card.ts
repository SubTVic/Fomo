// SPDX-License-Identifier: AGPL-3.0-only
// Branded share image for the result QR code: a poster card in the site's
// brutalist style (sky background, navy borders + offset shadow, Archivo
// Black headline). Portrait 4:5 so it fits Instagram stories/posts and the
// phone gallery. Browser-only (canvas + document.fonts).

import { QR_MARGIN, type QrMatrix } from "./qr";
import { SITE_URL } from "./site";

const NAVY = "#1a2a35";
const SKY = "#add8e6";
const CARD = "#ffffff";
const BODY = "#5a7a8a";
const ACCENT = "#5a8a9a";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const COPY = {
  de: {
    eyebrow: "TU DRESDEN",
    title: "Meine Hochschulgruppen-Matches",
    cta: "Scannen & mein Ergebnis ansehen",
  },
  en: {
    eyebrow: "TU DRESDEN",
    title: "My student-group matches",
    cta: "Scan to see my results",
  },
} as const;

const HEADING = '"Archivo Black", system-ui, sans-serif';
const BODY_FONT = 'Lexend, system-ui, sans-serif';

/** Canvas text uses fonts only once loaded — wait for the ones we draw with. */
async function loadFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`150px ${HEADING}`),
      document.fonts.load(`600 40px ${BODY_FONT}`),
      document.fonts.load(`400 32px ${BODY_FONT}`),
    ]);
  } catch {
    // fall back to system fonts — the card still works
  }
}

/** Largest font size ≤ max at which `text` fits into `width`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, width: number) {
  let px = max;
  ctx.font = font(px);
  while (px > 12 && ctx.measureText(text).width > width) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  // Not in every canvas implementation yet (older Safari) — purely cosmetic.
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value;
}

export async function drawQrCard(matrix: QrMatrix, lang: "de" | "en"): Promise<HTMLCanvasElement> {
  await loadFonts();
  const t = COPY[lang];
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  // Background + poster card with the offset "border-poster" shadow.
  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const card = { x: 66, y: 66, w: 930, h: 1200 };
  const border = 12;
  ctx.fillStyle = NAVY;
  ctx.fillRect(card.x + 18, card.y + 18, card.w, card.h);
  ctx.fillRect(card.x, card.y, card.w, card.h);
  ctx.fillStyle = CARD;
  ctx.fillRect(card.x + border, card.y + border, card.w - 2 * border, card.h - 2 * border);

  const left = card.x + 78;
  const innerWidth = card.w - 2 * 78;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.fillStyle = ACCENT;
  ctx.font = `600 30px ${BODY_FONT}`;
  setLetterSpacing(ctx, "6px");
  ctx.fillText(t.eyebrow, left, card.y + 130);
  setLetterSpacing(ctx, "0px");

  ctx.fillStyle = NAVY;
  ctx.font = `150px ${HEADING}`;
  ctx.fillText("FOMO", left - 6, card.y + 270);

  fitFont(ctx, t.title, (px) => `700 ${px}px ${BODY_FONT}`, 44, innerWidth);
  ctx.fillText(t.title, left, card.y + 350);

  // QR code inside a navy frame, centred.
  const qrSide = 560;
  const qrX = Math.round((CARD_WIDTH - qrSide) / 2) + 6;
  const qrY = card.y + 400;
  const frame = 8;
  ctx.fillStyle = NAVY;
  ctx.fillRect(qrX - frame, qrY - frame, qrSide + 2 * frame, qrSide + 2 * frame);
  ctx.fillStyle = CARD;
  ctx.fillRect(qrX, qrY, qrSide, qrSide);
  const modules = matrix.size + QR_MARGIN * 2;
  ctx.save();
  ctx.translate(qrX, qrY);
  ctx.scale(qrSide / modules, qrSide / modules);
  ctx.fillStyle = NAVY;
  ctx.fill(new Path2D(matrix.path));
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = BODY;
  fitFont(ctx, t.cta, (px) => `400 ${px}px ${BODY_FONT}`, 34, innerWidth);
  ctx.fillText(t.cta, CARD_WIDTH / 2 + 6, qrY + qrSide + frame + 68);

  // Footer: accent bar + domain, like the OpenGraph image.
  const footerY = card.y + card.h - 70;
  ctx.fillStyle = NAVY;
  ctx.fillRect(left, footerY - 18, 160, 16);
  ctx.textAlign = "right";
  ctx.font = `30px ${HEADING}`;
  ctx.fillText(SITE_URL.replace(/^https?:\/\/(www\.)?/, ""), card.x + card.w - 78, footerY);

  return canvas;
}
