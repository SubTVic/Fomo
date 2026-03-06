// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuestionWithOptions } from "@/types";

interface Props {
  question: QuestionWithOptions;
  value: string | string[] | undefined;
  onChange: (value: string) => void;
}

export function YesNoQuestion({ value, onChange }: Props) {
  const selected = typeof value === "string" ? value : undefined;

  return (
    <div className="flex gap-4">
      {[
        { label: "Ja", v: "1" },
        { label: "Nein", v: "0" },
      ].map(({ label, v }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-xl border-2 py-4 text-sm font-semibold transition-colors ${
            selected === v
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:border-primary/50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
