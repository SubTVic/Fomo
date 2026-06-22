// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";

/**
 * "Entstanden als Projekt von" — YETI & StuRa. The YETI logo lives in
 * public/group-logos/; a StuRa logo is not in the repo, so it shows as a
 * wordmark badge. Each logo falls back to a wordmark if its image is missing,
 * so the section never shows a broken image.
 */
export function Sponsors() {
  return (
    <section className="my-10 border-poster bg-card p-6 text-center sm:p-8">
      <p className="font-heading text-sm text-accent-muted">ENTSTANDEN ALS PROJEKT VON</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        <SponsorLogo src="/group-logos/YETI_Logo_Transparent_Black.png" name="YETI" />
        <SponsorLogo src="/sponsors/stura.png" name="StuRa" />
      </div>
      <p className="mx-auto mt-5 max-w-prose text-sm text-body">
        FOMO wird vom <strong className="text-navy">StuRa der TU Dresden</strong> gefördert und von
        der Hochschulgruppe <strong className="text-navy">YETI</strong> umgesetzt — von Studierenden
        für Studierende.
      </p>
    </section>
  );
}

function SponsorLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="border-poster bg-navy px-5 py-3 font-heading text-xl text-sky">{name}</span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-16 w-auto border-2 border-navy bg-white object-contain sm:h-20"
    />
  );
}
