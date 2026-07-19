// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { usePathname } from "next/navigation";
import { REGISTER_URL } from "@/lib/site";
import { track, EVENTS } from "@/lib/analytics";

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
      <p className="mt-2">
        {isEnglish ? "You run one of these groups? " : "Ihr seid Verantwortliche einer dieser Gruppen? "}
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(EVENTS.registerClick, { context: "unverified-notice" })}
          className="font-semibold text-navy underline underline-offset-4 hover:text-accent-muted"
        >
          {isEnglish ? "Confirm your profile →" : "Profil bestätigen →"}
        </a>
      </p>
    </div>
  );
}
