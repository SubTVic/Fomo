// SPDX-License-Identifier: AGPL-3.0-only
// Explanation shown on hover or keyboard focus (CSS only, no JS).

export function Hint({
  text,
  children,
  align = "center",
}: {
  text: string;
  children: React.ReactNode;
  /** Horizontal anchor of the bubble; use "start"/"end" near table edges. */
  align?: "start" | "center" | "end";
}) {
  const position =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span className="group/hint relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-20 mt-1.5 hidden w-64 whitespace-normal rounded border-2 border-foreground bg-card px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-foreground shadow-lg group-hover/hint:block group-focus-within/hint:block ${position}`}
      >
        {text}
      </span>
    </span>
  );
}
