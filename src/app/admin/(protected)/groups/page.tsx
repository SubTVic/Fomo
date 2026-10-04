// SPDX-License-Identifier: AGPL-3.0-only

export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAllGroupsForAdmin } from "@/lib/queries/groups";
import { groupStatus, type GroupStatusKey } from "@/lib/group-status";
import { Hint } from "@/components/shared/Hint";
import { VerifyButton } from "./VerifyButton";
import { GenerateInvitesButton } from "./GenerateInvitesButton";
import { InviteButton } from "./InviteButton";
import { DeleteButton } from "../DeleteButton";
import { requireAdminPage } from "@/lib/require-admin";

// Filter tabs: one per status the admin acts on. "Nicht im Quiz" bundles the
// three statuses that are only listed in the directory.
const FILTERS: Array<{ key: string; label: string; statuses: GroupStatusKey[] | null; hint: string }> = [
  { key: "", label: "Alle", statuses: null, hint: "Alle Gruppen, auch ausgeblendete." },
  {
    key: "review",
    label: "Zu prüfen",
    statuses: ["review"],
    hint: "Neu registriert oder eingereicht – wartet auf deine Prüfung.",
  },
  {
    key: "quiz",
    label: "Im Quiz",
    statuses: ["quiz"],
    hint: "Bestätigt und mit eigenem Profil: wird im Quiz empfohlen.",
  },
  {
    key: "not-quiz",
    label: "Nicht im Quiz",
    statuses: ["directory", "invited", "unconfirmed"],
    hint: "Steht nur im Verzeichnis: unbestätigt, eingeladen oder ohne eigenes Profil.",
  },
  { key: "hidden", label: "Ausgeblendet", statuses: ["hidden"], hint: "Nicht auf der Website sichtbar." },
];

interface AdminGroupsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminGroupsPage({ searchParams }: AdminGroupsPageProps) {
  const admin = await requireAdminPage();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  const { filter = "" } = await searchParams;
  const groups = (await getAllGroupsForAdmin()).map((g) => ({
    ...g,
    status: groupStatus({
      isActive: g.isActive,
      isVerified: g.isVerified,
      registrationStatus: g.registrationStatus,
      selfRatingAnswers: g.selfRating?._count.answers ?? 0,
    }),
  }));

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const inFilter = (f: (typeof FILTERS)[number]) =>
    f.statuses ? groups.filter((g) => f.statuses!.includes(g.status.key)) : groups;
  const shown = inFilter(active);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl uppercase">Hochschulgruppen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length} gesamt · Gruppe bearbeiten: auf den Namen oder „Bearbeiten“ klicken.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/groups/new"
            className="rounded-lg border bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + Neue Gruppe
          </Link>
          <GenerateInvitesButton />
        </div>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const count = inFilter(f).length;
          return (
            <Hint key={f.key} text={f.hint} align="start">
              <TabLink href={f.key ? `/admin/groups?filter=${f.key}` : "/admin/groups"} active={f === active}>
                {f.label}
                {f.key === "review" && count > 0 ? (
                  <span className="ml-1.5 rounded-full bg-orange-500 text-white px-1.5 py-0.5 text-[10px] font-bold">
                    {count}
                  </span>
                ) : (
                  <span className="ml-1">({count})</span>
                )}
              </TabLink>
            </Hint>
          );
        })}
      </div>

      <div className="border-2 border-foreground bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Kategorie</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shown.map((group) => (
              <tr key={group.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/groups/${group.id}`} className="hover:underline">
                    {group.name}
                  </Link>
                  {group.duplicateOf && (
                    <span className="block text-[11px] text-purple-600 font-normal">
                      mögliches Duplikat von {group.duplicateOf.name}
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground whitespace-nowrap md:table-cell">
                  {group.category.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Hint text={group.status.hint} align="start">
                    <span
                      tabIndex={0}
                      className={`cursor-help rounded-full px-2.5 py-0.5 text-xs font-medium ${group.status.className}`}
                    >
                      {group.status.label}
                    </span>
                  </Hint>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <Hint
                      text="Alle Angaben, Quiz-Antworten und Filter der Gruppe selbst ändern, verifizieren oder ausblenden. Jede Änderung landet unter „Änderungen“."
                      align="end"
                    >
                      <Link
                        href={`/admin/groups/${group.id}`}
                        className="rounded border border-foreground px-2 py-1 text-xs font-medium hover:bg-muted/40 transition-colors"
                      >
                        Bearbeiten
                      </Link>
                    </Hint>
                    <Hint
                      text="Persönlichen Link für die Gruppe erzeugen (12 Monate gültig). Damit pflegt die Gruppe ihr Profil selbst – ohne Login."
                      align="end"
                    >
                      <InviteButton
                        groupId={group.id}
                        groupName={group.name}
                        contactEmail={group.contactEmail}
                      />
                    </Hint>
                    {group.status.key === "review" && (
                      <Hint
                        text="Angaben geprüft? Dann bestätigen. Verifizierte Gruppen mit eigenem Profil kommen ins Quiz."
                        align="end"
                      >
                        <VerifyButton groupId={group.id} isVerified={false} />
                      </Hint>
                    )}
                    {isSuperAdmin && (
                      <Hint
                        text="Gruppe endgültig löschen. Im Zweifel lieber in der Gruppe „Deaktivieren“ – das lässt sich rückgängig machen."
                        align="end"
                      >
                        <DeleteButton
                          url={`/api/admin/groups/${group.id}`}
                          title={`${group.name} löschen`}
                        />
                      </Hint>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Keine Gruppen in dieser Ansicht.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "hover:bg-muted"
      }`}
    >
      {children}
    </a>
  );
}
