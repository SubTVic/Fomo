// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getAllGroupsForAdmin } from "@/lib/queries/groups";
import { ImportGroupsButton } from "./ImportGroupsButton";
import { VerifyButton } from "./VerifyButton";
import { GenerateInvitesButton } from "./GenerateInvitesButton";
import { InviteButton } from "./InviteButton";
import { DeleteGroupButton } from "./DeleteGroupButton";

const MATCHING_ATTRS = [
  "career",
  "tech",
  "socialImpact",
  "party",
  "religion",
  "sports",
  "networking",
  "arts",
  "music",
  "timeLow",
  "handsOn",
  "outdoor",
  "international",
  "beginnerFriendly",
  "competitive",
  "financialCost",
  "leadershipOpportunities",
] as const;

function countTrueAttributes(group: Record<string, unknown>): number {
  return MATCHING_ATTRS.filter((attr) => group[attr] === true).length;
}

function regStatusLabel(status: string | null): { text: string; className: string } {
  switch (status) {
    case "invited":
      return { text: "Eingeladen", className: "bg-blue-100 text-blue-800" };
    case "submitted":
      return { text: "Eingereicht", className: "bg-orange-100 text-orange-800" };
    case "verified":
      return { text: "Verifiziert", className: "bg-green-100 text-green-800" };
    default:
      return { text: "—", className: "bg-muted text-muted-foreground" };
  }
}

interface AdminGroupsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminGroupsPage({ searchParams }: AdminGroupsPageProps) {
  const { filter } = await searchParams;
  const allGroups = await getAllGroupsForAdmin();

  const filtered = (() => {
    if (filter === "csv") return allGroups.filter((g) => g.registeredVia === "import");
    if (filter === "survey") return allGroups.filter((g) => g.registeredVia === "survey");
    if (filter === "unverified") return allGroups.filter((g) => !g.isVerified);
    if (filter === "invited") return allGroups.filter((g) => g.registrationStatus === "invited");
    if (filter === "submitted") return allGroups.filter((g) => g.registrationStatus === "submitted");
    if (filter === "verified") return allGroups.filter((g) => g.registrationStatus === "verified");
    return allGroups;
  })();

  const submittedCount = allGroups.filter((g) => g.registrationStatus === "submitted").length;
  const invitedCount = allGroups.filter((g) => g.registrationStatus === "invited").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl uppercase">Hochschulgruppen</h1>
          <p className="text-sm text-muted-foreground mt-1">{allGroups.length} gesamt</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/groups/new"
            className="rounded-lg border bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + Neue Gruppe
          </Link>
          <GenerateInvitesButton />
          <ImportGroupsButton />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <TabLink href="/admin/groups" active={!filter}>Alle ({allGroups.length})</TabLink>
        <TabLink href="/admin/groups?filter=csv" active={filter === "csv"}>
          CSV-Import ({allGroups.filter((g) => g.registeredVia === "import").length})
        </TabLink>
        <TabLink href="/admin/groups?filter=invited" active={filter === "invited"}>
          Eingeladen ({invitedCount})
        </TabLink>
        <TabLink href="/admin/groups?filter=submitted" active={filter === "submitted"}>
          Eingereicht
          {submittedCount > 0 && (
            <span className="ml-1.5 rounded-full bg-orange-500 text-white px-1.5 py-0.5 text-[10px] font-bold">
              {submittedCount}
            </span>
          )}
        </TabLink>
        <TabLink href="/admin/groups?filter=unverified" active={filter === "unverified"}>
          Unverifiziert
        </TabLink>
      </div>

      <div className="border-2 border-foreground bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Kategorie</th>
                <th className="px-4 py-3 text-left font-medium">Beschreibung</th>
                <th className="px-4 py-3 text-center font-medium">Attribute</th>
                <th className="px-4 py-3 text-center font-medium">Registrierung</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Verifizierung</th>
                <th className="px-4 py-3 text-center font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((group) => {
                const attrCount = countTrueAttributes(group as Record<string, unknown>);
                const regStatus = regStatusLabel(group.registrationStatus);
                return (
                  <tr key={group.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[180px]">
                      <Link
                        href={`/admin/groups/${group.id}`}
                        className="block truncate hover:underline"
                        title={group.name}
                      >
                        {group.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {group.category.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[260px]">
                      <span className="block truncate" title={group.shortDescription}>
                        {group.shortDescription}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          attrCount >= 5
                            ? "bg-blue-100 text-blue-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {attrCount} / {MATCHING_ATTRS.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${regStatus.className}`}>
                        {regStatus.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          group.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {group.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <VerifyButton groupId={group.id} isVerified={group.isVerified} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <InviteButton
                          groupId={group.id}
                          groupName={group.name}
                          contactEmail={group.contactEmail}
                        />
                        <DeleteGroupButton groupId={group.id} groupName={group.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
