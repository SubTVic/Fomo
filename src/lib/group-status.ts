// SPDX-License-Identifier: AGPL-3.0-only
// One status per group for the admin UI, replacing the separate "Profil",
// "Registrierung", "Status" and "Verifizierung" badges. Mirrors the export
// rule (src/lib/export/static-groups.ts): only active, verified groups with a
// real self-rating are matched in the quiz.

import { RegistrationStatus } from "@prisma/client";

export type GroupStatusKey = "hidden" | "review" | "quiz" | "directory" | "invited" | "unconfirmed";

export interface GroupStatus {
  key: GroupStatusKey;
  label: string;
  /** Tailwind classes for the badge. */
  className: string;
  /** Explanation shown on hover. */
  hint: string;
}

export interface GroupStatusInput {
  isActive: boolean;
  isVerified: boolean;
  registrationStatus: RegistrationStatus | null;
  /** Number of answers in the group's own self-rating (0 = none). */
  selfRatingAnswers: number;
}

const STATUS: Record<GroupStatusKey, Omit<GroupStatus, "key">> = {
  hidden: {
    label: "Ausgeblendet",
    className: "bg-muted text-muted-foreground",
    hint: "Nicht auf der Website sichtbar. Zum Einblenden die Gruppe öffnen und „Aktivieren“ klicken.",
  },
  review: {
    label: "Zu prüfen",
    className: "bg-orange-100 text-orange-800",
    hint: "Die Gruppe hat sich registriert oder ihr Profil eingereicht. Angaben prüfen, dann „Verifizieren“ – erst danach kommt sie ins Quiz.",
  },
  quiz: {
    label: "Im Quiz",
    className: "bg-green-100 text-green-800",
    hint: "Bestätigt und mit eigenem Profil (21 Fragen): erscheint im Verzeichnis und als Quiz-Empfehlung.",
  },
  directory: {
    label: "Nur Verzeichnis",
    className: "bg-blue-100 text-blue-800",
    hint: "Bestätigt, aber ohne eigenes Profil (21 Fragen): steht im Verzeichnis, wird im Quiz nicht empfohlen. Bearbeitungslink schicken, damit die Gruppe die Fragen beantwortet.",
  },
  invited: {
    label: "Eingeladen",
    className: "bg-sky-50 text-sky-800",
    hint: "Bearbeitungslink verschickt, die Gruppe hat noch nicht geantwortet. Steht als „unbestätigt“ im Verzeichnis, nicht im Quiz.",
  },
  unconfirmed: {
    label: "Unbestätigt",
    className: "bg-yellow-50 text-yellow-800",
    hint: "Angaben aus öffentlichen Quellen, von der Gruppe nicht bestätigt. Steht als „unbestätigt“ im Verzeichnis, nicht im Quiz.",
  },
};

export function groupStatusKey(g: GroupStatusInput): GroupStatusKey {
  if (!g.isActive) return "hidden";
  if (g.isVerified) return g.selfRatingAnswers > 0 ? "quiz" : "directory";
  if (g.registrationStatus === RegistrationStatus.SUBMITTED) return "review";
  if (g.registrationStatus === RegistrationStatus.INVITED) return "invited";
  return "unconfirmed";
}

export function groupStatus(g: GroupStatusInput): GroupStatus {
  const key = groupStatusKey(g);
  return { key, ...STATUS[key] };
}
