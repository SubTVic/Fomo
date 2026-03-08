// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface GroupData {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string | null;
  categoryId: string;
  contactEmail: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  memberCount: number | null;
  meetingSchedule: string | null;
  motto: string | null;
  foundedYear: number | null;
  // Boolean matching attributes
  career: boolean;
  tech: boolean;
  socialImpact: boolean;
  party: boolean;
  religion: boolean;
  sports: boolean;
  networking: boolean;
  arts: boolean;
  music: boolean;
  timeLow: boolean;
  handsOn: boolean;
  outdoor: boolean;
  international: boolean;
  beginnerFriendly: boolean;
  competitive: boolean;
  financialCost: boolean;
  leadershipOpportunities: boolean;
  // Categorical
  language: string | null;
  eventFrequency: string | null;
  groupSize: string | null;
}

const MATCHING_ATTRS = [
  { key: "career", label: "Karriere" },
  { key: "tech", label: "Technik" },
  { key: "socialImpact", label: "Soziales Engagement" },
  { key: "party", label: "Party" },
  { key: "religion", label: "Religion" },
  { key: "sports", label: "Sport" },
  { key: "networking", label: "Networking" },
  { key: "arts", label: "Kunst" },
  { key: "music", label: "Musik" },
  { key: "timeLow", label: "Geringer Zeitaufwand" },
  { key: "handsOn", label: "Hands-On" },
  { key: "outdoor", label: "Outdoor" },
  { key: "international", label: "International" },
  { key: "beginnerFriendly", label: "Einsteigerfreundlich" },
  { key: "competitive", label: "Wettbewerb" },
  { key: "financialCost", label: "Kosten" },
  { key: "leadershipOpportunities", label: "Leitungspositionen" },
] as const;

export function GroupEditForm({
  group,
  categories,
}: {
  group: GroupData;
  categories: Category[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state
  const [name, setName] = useState(group.name);
  const [slug, setSlug] = useState(group.slug);
  const [shortDescription, setShortDescription] = useState(
    group.shortDescription
  );
  const [longDescription, setLongDescription] = useState(
    group.longDescription ?? ""
  );
  const [categoryId, setCategoryId] = useState(group.categoryId);
  const [contactEmail, setContactEmail] = useState(group.contactEmail ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(group.websiteUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(group.instagramUrl ?? "");

  // Details
  const [memberCount, setMemberCount] = useState(
    group.memberCount?.toString() ?? ""
  );
  const [meetingSchedule, setMeetingSchedule] = useState(
    group.meetingSchedule ?? ""
  );
  const [motto, setMotto] = useState(group.motto ?? "");
  const [foundedYear, setFoundedYear] = useState(
    group.foundedYear?.toString() ?? ""
  );

  // Boolean matching attributes
  const [boolAttrs, setBoolAttrs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const attr of MATCHING_ATTRS) {
      initial[attr.key] = group[attr.key as keyof GroupData] as boolean;
    }
    return initial;
  });

  // Categorical
  const [language, setLanguage] = useState(group.language ?? "");
  const [eventFrequency, setEventFrequency] = useState(
    group.eventFrequency ?? ""
  );
  const [groupSize, setGroupSize] = useState(group.groupSize ?? "");

  function toggleAttr(key: string) {
    setBoolAttrs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const body = {
      name,
      slug,
      shortDescription,
      longDescription: longDescription || null,
      categoryId,
      contactEmail: contactEmail || null,
      websiteUrl: websiteUrl || null,
      instagramUrl: instagramUrl || null,
      memberCount: memberCount ? parseInt(memberCount, 10) : null,
      meetingSchedule: meetingSchedule || null,
      motto: motto || null,
      foundedYear: foundedYear ? parseInt(foundedYear, 10) : null,
      ...boolAttrs,
      language: language || null,
      eventFrequency: eventFrequency || null,
      groupSize: groupSize || null,
    };

    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: "Gruppe gespeichert." });
        router.refresh();
      } else {
        const data = await res.json();
        setFeedback({
          type: "error",
          message: data.error ?? "Fehler beim Speichern.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Netzwerkfehler." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "border-2 border-foreground/30 bg-card px-3 py-2 text-sm w-full";
  const labelClass = "block text-sm font-medium mb-1";
  const sectionClass = "border-t border-foreground/10 pt-6 mt-6";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Feedback */}
      {feedback && (
        <div
          className={`border-2 px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-green-600 bg-green-50 text-green-800"
              : "border-red-600 bg-red-50 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* === Basis === */}
      <h2 className="font-heading text-lg uppercase">Basis</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="^[a-z0-9-]+$"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Kurzbeschreibung (max. 200)</label>
        <input
          type="text"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Langbeschreibung</label>
        <textarea
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          rows={4}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Kategorie</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Kontakt-Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Website-URL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Instagram-URL</label>
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* === Details === */}
      <div className={sectionClass}>
        <h2 className="font-heading text-lg uppercase">Details</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Mitgliederzahl</label>
            <input
              type="number"
              value={memberCount}
              onChange={(e) => setMemberCount(e.target.value)}
              min={1}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Treffzeiten</label>
            <input
              type="text"
              value={meetingSchedule}
              onChange={(e) => setMeetingSchedule(e.target.value)}
              placeholder="z.B. Jeden Dienstag 19:00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Motto</label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Gruendungsjahr</label>
            <input
              type="number"
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value)}
              min={1800}
              max={2100}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* === Matching-Attribute === */}
      <div className={sectionClass}>
        <h2 className="font-heading text-lg uppercase">Matching-Attribute</h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {MATCHING_ATTRS.map((attr) => (
            <label
              key={attr.key}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={boolAttrs[attr.key]}
                onChange={() => toggleAttr(attr.key)}
                className="h-4 w-4 accent-foreground"
              />
              {attr.label}
            </label>
          ))}
        </div>
      </div>

      {/* === Kategoriale Attribute === */}
      <div className={sectionClass}>
        <h2 className="font-heading text-lg uppercase">
          Kategoriale Attribute
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Sprache</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClass}
            >
              <option value="">-- keine Angabe --</option>
              <option value="german">Deutsch</option>
              <option value="both">Deutsch & Englisch</option>
              <option value="english">Englisch</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Event-Haeufigkeit</label>
            <select
              value={eventFrequency}
              onChange={(e) => setEventFrequency(e.target.value)}
              className={inputClass}
            >
              <option value="">-- keine Angabe --</option>
              <option value="low">Selten</option>
              <option value="medium">Mittel</option>
              <option value="high">Haeufig</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Gruppengroesse</label>
            <select
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              className={inputClass}
            >
              <option value="">-- keine Angabe --</option>
              <option value="small">Klein</option>
              <option value="medium">Mittel</option>
              <option value="large">Gross</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="border-t border-foreground/10 pt-6 mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-foreground text-primary-foreground font-heading uppercase px-6 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
        <Link
          href="/admin/groups"
          className="text-sm text-muted-foreground hover:underline"
        >
          Zurueck zur Liste
        </Link>
      </div>
    </form>
  );
}
