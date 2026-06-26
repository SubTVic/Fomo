// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";

export function Sponsors() {
  return (
    <section className="mt-6 sm:mt-10">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        <SponsorLogo src="/logos/yeti.png" name="YETI" />
        <SponsorLogo src="/logos/stura.png" name="StuRa" />
      </div>
    </section>
  );
}

function SponsorLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="border-poster bg-card px-5 py-3 font-heading text-xl text-navy poster-shadow">
        {name}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="eager"
      onError={() => setFailed(true)}
      className="max-h-20 w-auto object-contain sm:max-h-24"
    />
  );
}
