// SPDX-License-Identifier: AGPL-3.0-only

"use client";

import { useState } from "react";
import Image from "next/image";
import { SITE_DEFAULTS } from "@/lib/queries/site-config";

interface Props {
  initialConfig: Record<string, string>;
}

// Field definitions for the editor form
const TEXT_FIELDS: { key: string; label: string; multiline?: boolean }[] = [
  { key: "hero_title", label: "Überschrift (Header)", multiline: true },
  { key: "hero_subtitle", label: "Untertitel (Header)", multiline: true },
  { key: "image_caption", label: "Bildunterschrift" },
  { key: "pilot_label", label: "CTA Label (klein)" },
  { key: "pilot_title", label: "CTA Überschrift" },
  { key: "pilot_text", label: "CTA Beschreibung", multiline: true },
  { key: "pilot_button", label: "CTA Button-Text" },
  { key: "pilot_duration", label: "CTA Dauer-Hinweis" },
];

export function SiteConfigEditor({ initialConfig }: Props) {
  const [config, setConfig] = useState<Record<string, string>>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function resetField(key: string) {
    if (SITE_DEFAULTS[key] !== undefined) {
      update(key, SITE_DEFAULTS[key]);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Speichern fehlgeschlagen");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── Text Fields ────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg uppercase mb-4">Texte</h2>
        <div className="border-2 border-foreground bg-card p-6 flex flex-col gap-5">
          {TEXT_FIELDS.map(({ key, label, multiline }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{label}</label>
                {config[key] !== SITE_DEFAULTS[key] && (
                  <button
                    onClick={() => resetField(key)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
              {multiline ? (
                <textarea
                  rows={3}
                  value={config[key] ?? ""}
                  onChange={(e) => update(key, e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <input
                  type="text"
                  value={config[key] ?? ""}
                  onChange={(e) => update(key, e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Image Fields ───────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-lg uppercase mb-4">Bilder (6 Gruppen-Fotos)</h2>
        <div className="border-2 border-foreground bg-card p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const srcKey = `image_${n}_src`;
              const altKey = `image_${n}_alt`;
              const src = config[srcKey] ?? "";
              const alt = config[altKey] ?? "";

              return (
                <div key={n} className="flex flex-col gap-2 border rounded-lg p-3">
                  {/* Preview */}
                  <div className="aspect-square relative overflow-hidden rounded bg-muted">
                    {src && (
                      <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Bild-URL
                    </label>
                    <input
                      type="text"
                      value={src}
                      onChange={(e) => update(srcKey, e.target.value)}
                      placeholder="/images/groups/foto.jpg"
                      className="rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Alt-Text (Gruppenname)
                    </label>
                    <input
                      type="text"
                      value={alt}
                      onChange={(e) => update(altKey, e.target.value)}
                      placeholder="Gruppenname"
                      className="rounded border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {(config[srcKey] !== SITE_DEFAULTS[srcKey] ||
                    config[altKey] !== SITE_DEFAULTS[altKey]) && (
                    <button
                      onClick={() => {
                        resetField(srcKey);
                        resetField(altKey);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground self-end"
                    >
                      Zurücksetzen
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Bilder müssen als Datei unter <code>/public/images/groups/</code> liegen.
            Gib den Pfad relativ zum Projektroot an, z.B. <code>/images/groups/foto.jpg</code>.
          </p>
        </div>
      </section>

      {/* ── Save Button ────────────────────────────────────────── */}
      <div className="sticky bottom-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-foreground text-primary-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] transition-colors disabled:opacity-50"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            Gespeichert!
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600 font-medium">{error}</span>
        )}
      </div>
    </div>
  );
}
