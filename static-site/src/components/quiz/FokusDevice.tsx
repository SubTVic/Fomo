// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The FOKUS tag: FOKUS's own product image (public/partners/fokus-tag.webp),
 * with an optional charge outline (0–1) that fills around the hexagon and a
 * glow when ready. The image is cropped so the hexagon matches the outline.
 */
export function FokusDevice({
  size = 64,
  charge,
  ready = false,
  className = "",
}: {
  size?: number;
  /** 0–1: draws a cream progress line around the hexagon. */
  charge?: number;
  ready?: boolean;
  className?: string;
}) {
  const hex = "50,5 91,28.5 91,71.5 50,95 9,71.5 9,28.5";
  return (
    <span
      aria-hidden
      className={`relative block ${className}`}
      style={{
        width: size,
        height: size,
        // the matte black tag needs a faint light rim on the dark blue background
        filter: ready
          ? "drop-shadow(0 0 2px rgba(254,250,243,0.9)) drop-shadow(0 0 12px rgba(254,250,243,0.7))"
          : "drop-shadow(0 0 1px rgba(254,250,243,0.55)) drop-shadow(0 4px 6px rgba(0,0,0,0.45))",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, small local asset */}
      <img src="/partners/fokus-tag.webp" alt="" width={size} height={size} draggable={false} className="block h-full w-full select-none" />
      {charge !== undefined && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
          <polygon points={hex} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={5} strokeLinejoin="round" transform="translate(50 50) scale(1.16) translate(-50 -50)" />
          <polygon
            points={hex}
            fill="none"
            stroke="#fefaf3"
            strokeWidth={5}
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray={`${Math.max(0, Math.min(1, charge)) * 100} 100`}
            transform="translate(50 50) scale(1.16) translate(-50 -50)"
            style={{ transition: "stroke-dasharray 0.25s" }}
          />
        </svg>
      )}
    </span>
  );
}
