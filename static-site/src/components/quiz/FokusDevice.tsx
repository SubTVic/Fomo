// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The FOKUS tag as it really looks: a matte dark-grey hexagon with "FOKUS"
 * embossed into it (drawn as SVG, no image asset). Optional charge outline
 * (0–1) that fills around the edge, and a glow when ready.
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
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`block overflow-visible ${className}`}
      style={ready ? { filter: "drop-shadow(0 0 10px rgba(254,250,243,0.75))" } : undefined}
    >
      <defs>
        <linearGradient id="fokus-device-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7a7a7a" />
          <stop offset="1" stopColor="#4a4a4a" />
        </linearGradient>
      </defs>
      {/* body with soft, rounded corners */}
      <polygon points={hex} fill="url(#fokus-device-face)" stroke="#3a3a3a" strokeWidth={7} strokeLinejoin="round" />
      {/* light rim so the matte body reads on dark backgrounds */}
      <polygon points={hex} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeLinejoin="round" transform="translate(50 50) scale(1.07) translate(-50 -50)" />
      {/* embossed lettering: light edge below, dark letters on top */}
      <text x="50" y="57.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={17} letterSpacing={0.5} fill="rgba(255,255,255,0.28)">
        FOKUS
      </text>
      <text x="50" y="56.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={17} letterSpacing={0.5} fill="#333">
        FOKUS
      </text>
      {charge !== undefined && (
        <>
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
        </>
      )}
    </svg>
  );
}
