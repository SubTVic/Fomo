// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/groups", label: "Gruppen" },
    { href: "/quiz", label: "Quiz" },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="w-full">
      <nav className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="border-poster bg-card px-3.5 py-1.5 font-heading text-[22px] text-navy"
          aria-label="FOMO Startseite"
        >
          FOMO
        </Link>
        <div className="flex items-center gap-4 text-sm font-semibold uppercase tracking-wide">
          {links.map(({ href, label }) =>
            isActive(href) ? (
              <Link
                key={href}
                href={href}
                aria-current="page"
                className="border-poster bg-navy px-3 py-1.5 text-sky transition-colors hover:bg-navy-hover"
              >
                {label}
              </Link>
            ) : (
              <Link
                key={href}
                href={href}
                className="text-body transition-colors hover:text-navy"
              >
                {label}
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
