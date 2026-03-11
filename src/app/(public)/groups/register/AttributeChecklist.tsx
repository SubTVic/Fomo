// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Attribute definitions ───────────────────────────────────────────────────

interface AttributeDef {
  key: string;
  label: string;
  description: string;
  group: string;
}

const ATTRIBUTE_GROUPS: { title: string; attributes: AttributeDef[] }[] = [
  {
    title: "Aktivitätstyp",
    attributes: [
      { key: "hands_on", label: "Hands-on", description: "Praktisch: Bauen, programmieren, gestalten", group: "activity" },
      { key: "outdoor", label: "Outdoor", description: "Regelmäßig Aktivitäten im Freien", group: "activity" },
      { key: "tech", label: "Technologie", description: "Coding, IT, digitale Systeme als Kern", group: "activity" },
      { key: "sports", label: "Sport", description: "Sportliche Aktivitäten als Kernbestandteil", group: "activity" },
      { key: "arts", label: "Kreativ", description: "Künstlerische/kreative Aktivitäten", group: "activity" },
      { key: "music", label: "Musik", description: "Musik als Kernaktivität", group: "activity" },
    ],
  },
  {
    title: "Soziales & Werte",
    attributes: [
      { key: "social_impact", label: "Gesellschaft", description: "Soziales/politisches Engagement", group: "social" },
      { key: "religion", label: "Religion", description: "Religiöse/weltanschauliche Ausrichtung", group: "social" },
      { key: "international", label: "International", description: "Internationale Mitglieder, interkulturell", group: "social" },
      { key: "language", label: "Sprache", description: "Kommunikation (auch) auf Englisch", group: "social" },
    ],
  },
  {
    title: "Karriere & Vernetzung",
    attributes: [
      { key: "career", label: "Karriere", description: "Unternehmenskontakte, Mentoring", group: "career" },
      { key: "networking", label: "Networking", description: "Explizit Kontakte knüpfen als Zweck", group: "career" },
      { key: "competitive", label: "Wettbewerb", description: "Turniere, Rankings, Competitions", group: "career" },
    ],
  },
  {
    title: "Struktur & Zugang",
    attributes: [
      { key: "group_size", label: "Große Gruppe", description: "Mehr als 20 aktive Mitglieder", group: "structure" },
      { key: "event_frequency", label: "Regelmäßig", description: "Treffen/Events mind. 2× pro Monat", group: "structure" },
      { key: "time_low", label: "Wenig Zeit", description: "Engagement mit max. 2h/Woche möglich", group: "structure" },
      { key: "leadership_opportunities", label: "Verantwortung", description: "Führungsrollen möglich", group: "structure" },
      { key: "beginner_friendly", label: "Einsteigerfreundlich", description: "Keine Vorkenntnisse nötig", group: "structure" },
      { key: "party", label: "Socializing", description: "Gesellige Events neben Kernaktivität", group: "structure" },
    ],
  },
];

// Map from Prisma boolean field names to our attribute keys
const PRISMA_TO_ATTR: Record<string, string> = {
  career: "career", tech: "tech", socialImpact: "social_impact",
  party: "party", religion: "religion", sports: "sports",
  networking: "networking", arts: "arts", music: "music",
  timeLow: "time_low", handsOn: "hands_on", outdoor: "outdoor",
  international: "international", beginnerFriendly: "beginner_friendly",
  competitive: "competitive", leadershipOpportunities: "leadership_opportunities",
};

type Attrs = Record<string, 0 | 1>;

interface GroupData {
  id: string;
  name: string;
  shortDescription: string;
  websiteUrl: string | null;
  scraperAttributes: Record<string, { value: 0 | 1; confidence: number; reason?: string }> | null;
  confirmedAttributes: Attrs | null;
  [key: string]: unknown;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AttributeChecklist() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "error" | "ready" | "submitting" | "done">("loading");
  const [error, setError] = useState("");
  const [group, setGroup] = useState<GroupData | null>(null);
  const [attrs, setAttrs] = useState<Attrs>({});
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  // Load group data from token
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Kein Einladungslink gefunden. Bitte nutze den Link aus deiner E-Mail.");
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/groups/register-attributes?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setError(data.error ?? "Unbekannter Fehler");
          return;
        }

        const g = data.group as GroupData;
        setGroup(g);
        setDescription(g.shortDescription);
        setWebsite(g.websiteUrl ?? "");

        // Pre-fill attributes: confirmed > scraper > current booleans
        const initial: Attrs = {};

        // Start with current boolean values from DB
        for (const [prismaKey, attrKey] of Object.entries(PRISMA_TO_ATTR)) {
          initial[attrKey] = g[prismaKey] ? 1 : 0;
        }
        // language/event_frequency/group_size are string fields — map to binary
        initial.language = (g.language === "both" || g.language === "english") ? 1 : 0;
        initial.event_frequency = (g.eventFrequency === "high" || g.eventFrequency === "medium") ? 1 : 0;
        initial.group_size = g.groupSize === "large" ? 1 : 0;

        // Override with scraper data if available
        if (g.scraperAttributes) {
          for (const [key, val] of Object.entries(g.scraperAttributes)) {
            initial[key] = val.value;
          }
        }

        // Override with confirmed data if already submitted before
        if (g.confirmedAttributes) {
          for (const [key, val] of Object.entries(g.confirmedAttributes)) {
            initial[key] = val as 0 | 1;
          }
        }

        setAttrs(initial);
        setStatus("ready");
      } catch {
        setStatus("error");
        setError("Netzwerkfehler – bitte erneut versuchen.");
      }
    }

    load();
  }, [token]);

  const toggleAttr = useCallback((key: string) => {
    setAttrs((prev) => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!token) return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/groups/register-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          confirmedAttributes: attrs,
          shortDescription: description.trim(),
          websiteUrl: website.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("done");
      } else {
        setStatus("ready");
        setError(data.error ?? "Fehler beim Speichern.");
      }
    } catch {
      setStatus("ready");
      setError("Netzwerkfehler – bitte erneut versuchen.");
    }
  }, [token, attrs, description, website]);

  // ── Error state ──
  if (status === "error") {
    return (
      <div className="flex flex-col items-center px-4 py-20 text-center">
        <div className="w-full max-w-[520px] border-4 border-foreground bg-card px-6 py-10 sm:px-8">
          <h1 className="font-heading text-xl uppercase mb-4">Fehler</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Einladung wird geladen…
      </div>
    );
  }

  // ── Done state ──
  if (status === "done") {
    return (
      <div className="flex flex-col items-center px-4 py-20 text-center">
        <div className="w-full max-w-[520px] border-4 border-foreground bg-card px-6 py-10 sm:px-8">
          <h1 className="font-heading text-xl uppercase mb-4">Profil gespeichert!</h1>
          <p className="text-muted-foreground text-sm">
            Danke! Euer Profil ist jetzt hinterlegt und wird vom FOMO-Team geprüft.
          </p>
          <Link
            href="/groups"
            className="mt-6 inline-block bg-foreground px-6 py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-[#2a3a45] transition-colors"
          >
            Zur Gruppenübersicht
          </Link>
        </div>
      </div>
    );
  }

  // ── Checklist form ──
  const scraperData = group?.scraperAttributes;

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-[600px] border-4 border-foreground bg-card">
        {/* Header */}
        <div className="bg-foreground text-primary-foreground px-6 py-5 sm:px-8">
          <h1 className="font-heading text-xl uppercase">Profil bestätigen</h1>
          <p className="mt-1 text-sm text-primary-foreground/60">
            {group?.name}
          </p>
        </div>

        <div className="px-5 py-6 sm:px-8 flex flex-col gap-6">
          {/* Intro */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Wir haben eure Gruppe recherchiert und diese Attribute vorausgefüllt.
            Bitte prüft und korrigiert sie — das dauert nur 2 Minuten.
          </p>

          {/* Attribute groups */}
          {ATTRIBUTE_GROUPS.map((grp) => (
            <div key={grp.title} className="flex flex-col gap-2">
              <h2 className="font-heading text-xs uppercase tracking-wider border-b-2 border-foreground pb-1">
                {grp.title}
              </h2>
              {grp.attributes.map((attr) => {
                const isOn = attrs[attr.key] === 1;
                const scraperInfo = scraperData?.[attr.key];
                const lowConfidence = scraperInfo && scraperInfo.confidence < 0.6;

                return (
                  <button
                    key={attr.key}
                    type="button"
                    onClick={() => toggleAttr(attr.key)}
                    className={`flex items-start gap-3 px-3 py-2.5 border-2 text-left transition-colors ${
                      isOn
                        ? "border-foreground bg-foreground/5"
                        : "border-foreground/20 bg-card hover:border-foreground/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 text-xs font-bold transition-colors ${
                        isOn
                          ? "border-foreground bg-foreground text-primary-foreground"
                          : "border-foreground/30 bg-card"
                      }`}
                    >
                      {isOn ? "\u2713" : ""}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{attr.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {attr.description}
                      </span>
                      {lowConfidence && (
                        <span className="block text-[10px] text-[#eab308] mt-0.5">
                          Unsicher — bitte prüfen
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Description edit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Kurzbeschreibung</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            />
            <span className="text-xs text-muted-foreground">
              {description.trim().length}/200 Zeichen
            </span>
          </div>

          {/* Website edit */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              className="w-full border-2 border-foreground/30 bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          {/* Error */}
          {error && status === "ready" && (
            <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={status === "submitting"}
            className="w-full bg-foreground py-4 font-heading text-base uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[#2a3a45] disabled:opacity-40"
          >
            {status === "submitting" ? "Wird gespeichert…" : "Profil speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
