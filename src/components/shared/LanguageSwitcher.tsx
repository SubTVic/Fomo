// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: "de" | "en") {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="flex items-center border-2 border-foreground/40 text-xs font-bold uppercase tracking-wider overflow-hidden"
      aria-label="Sprache / Language"
    >
      <button
        onClick={() => switchLocale("de")}
        disabled={isPending || locale === "de"}
        className={`px-2.5 py-1 transition-colors ${
          locale === "de"
            ? "bg-foreground text-primary-foreground"
            : "hover:bg-foreground/10"
        }`}
        aria-label="Deutsch"
        aria-pressed={locale === "de"}
      >
        DE
      </button>
      <div className="w-px bg-foreground/40 self-stretch" />
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending || locale === "en"}
        className={`px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-foreground text-primary-foreground"
            : "hover:bg-foreground/10"
        }`}
        aria-label="English"
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
