// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { track, EVENTS } from "@/lib/analytics";
import { QR_MARGIN, qrMatrix } from "@/lib/qr";

/**
 * "Show as QR code" on the results page: the current URL (which carries the
 * whole result in ?r=) as a scannable code — e.g. to pass your matches to the
 * person next to you in the Erstiwoche without exchanging numbers.
 * Everything happens in the browser; nothing is uploaded.
 */
export function QrShare() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  // The URL is read when the panel opens; editing answers leaves the results
  // screen, so it cannot go stale while shown.
  const [url, setUrl] = useState<string | null>(null);
  const matrix = useMemo(() => {
    if (!url) return null;
    try {
      return qrMatrix(url);
    } catch {
      return null; // data too long for a QR code — should not happen for ?r= links
    }
  }, [url]);
  const open = url !== null;

  function toggle() {
    if (open) {
      setUrl(null);
      return;
    }
    track(EVENTS.resultsShareQr, { action: "show" });
    setUrl(window.location.href);
  }

  function download() {
    if (!matrix) return;
    track(EVENTS.resultsShareQr, { action: "download" });
    // PNG rather than SVG: phones save it straight to the photo gallery.
    const scale = 12;
    const side = (matrix.size + QR_MARGIN * 2) * scale;
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, side, side);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#1a2a35";
    ctx.fill(new Path2D(matrix.path));
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = isEnglish ? "fomo-results-qr.png" : "fomo-ergebnis-qr.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const total = matrix ? matrix.size + QR_MARGIN * 2 : 0;

  return (
    <div className="sm:col-span-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="results-qr"
        className="w-full border-poster bg-card px-6 py-3 text-center font-heading text-navy transition-colors hover:bg-surface"
      >
        {open
          ? isEnglish
            ? "Hide QR code"
            : "QR-Code ausblenden"
          : isEnglish
            ? "Show QR code"
            : "Als QR-Code teilen"}
      </button>

      {open && (
        <div id="results-qr" className="mt-3 border-poster bg-card p-5 text-center">
          {matrix ? (
            <>
              <svg
                viewBox={`0 0 ${total} ${total}`}
                role="img"
                aria-label={isEnglish ? "QR code linking to your results" : "QR-Code mit Link zu deinem Ergebnis"}
                shapeRendering="crispEdges"
                className="mx-auto block aspect-square w-full max-w-[280px]"
              >
                <rect width={total} height={total} fill="#ffffff" />
                <path d={matrix.path} fill="#1a2a35" />
              </svg>
              <p className="mt-3 text-sm text-body">
                {isEnglish
                  ? "Scan with your phone camera to open these results."
                  : "Mit der Handykamera scannen, um dieses Ergebnis zu öffnen."}
              </p>
              <button
                type="button"
                onClick={download}
                className="mt-4 border-poster bg-navy px-5 py-2 font-heading text-sky transition-colors hover:bg-navy-hover"
              >
                {isEnglish ? "Save image" : "Bild speichern"}
              </button>
            </>
          ) : (
            <p className="text-body">
              {isEnglish ? "QR code could not be created." : "QR-Code konnte nicht erstellt werden."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
