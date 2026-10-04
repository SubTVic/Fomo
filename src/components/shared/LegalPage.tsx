// SPDX-License-Identifier: AGPL-3.0-only
// Layout for the German-only legal pages (Impressum, Datenschutz).

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div lang="de" className="w-full max-w-[760px] border-4 border-foreground bg-card px-6 py-8 sm:px-8">
        <h1 className="font-heading text-[clamp(18px,4.6vw,36px)] uppercase leading-none hyphens-auto break-words">
          {title}
        </h1>
        <div className="mt-8 flex flex-col gap-7 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-base uppercase text-foreground hyphens-auto break-words">
        {title}
      </h2>
      {children}
    </section>
  );
}
