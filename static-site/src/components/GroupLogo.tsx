// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";
import { categoryColorOf } from "@/lib/data";

/** Square group logo; falls back to the initial on its category colour. */
export function GroupLogo({ group, size = 48 }: { group: Group; size?: number }) {
  const [failed, setFailed] = useState(false);
  const px = `${size}px`;

  if (group.logoUrl && !failed) {
    return (
      <img
        src={group.logoUrl}
        alt={`${group.name} Logo`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0 border-2 border-navy bg-white object-contain"
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center border-2 border-navy font-heading text-white"
      style={{ width: px, height: px, backgroundColor: categoryColorOf(group), fontSize: size * 0.42 }}
    >
      {group.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
