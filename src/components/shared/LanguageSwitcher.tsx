// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      // pathname includes the locale prefix for non-default locales
      // Strip any existing locale prefix and re-add the new one
      const withoutLocale = pathname.replace(/^\/(de|en)/, "") || "/";
      const newPath = next === "de" ? withoutLocale : `/${next}${withoutLocale}`;
      router.push(newPath);
    });
  }

  return (
    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
      <button
        onClick={() => switchLocale("de")}
        disabled={isPending}
        className={`px-1.5 py-0.5 transition-colors ${
          locale === "de"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Deutsch"
      >
        DE
      </button>
      <span className="text-muted-foreground/40">|</span>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`px-1.5 py-0.5 transition-colors ${
          locale === "en"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
