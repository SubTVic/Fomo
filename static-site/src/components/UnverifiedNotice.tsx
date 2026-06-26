// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { usePathname } from "next/navigation";

export function UnverifiedNotice() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");

  return (
    <div className="border-2 border-navy bg-card p-4 text-sm text-body">
      <p className="mb-1 font-heading text-xs uppercase tracking-wider text-navy">
        {isEnglish ? "Note on unverified groups" : "Hinweis zu unbestätigten Gruppen"}
      </p>
      <p>
        {isEnglish
          ? "These profiles were assembled from publicly available sources and have not been officially confirmed by a group representative. They may be incomplete, outdated or incorrect."
          : "Die Profile dieser Gruppen wurden von einer KI aus öffentlich verfügbaren Internetquellen zusammengetragen. Kein:e Gruppenverantwortliche:r hat die Angaben offiziell bestätigt. Sie können unvollständig, veraltet oder fehlerhaft sein."}
      </p>
    </div>
  );
}
