// SPDX-License-Identifier: AGPL-3.0-only

export function YetiBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center border-2 border-current font-extrabold leading-none text-center align-middle w-[22px] h-[22px] text-[7px] pt-px ${className ?? ""}`}
    >
      YE
      <br />
      TI
    </span>
  );
}
