// SPDX-License-Identifier: AGPL-3.0-only

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

// Public group fields for the root app's /groups page. Only add fields here
// that may appear in public HTML — never contact persons, onboarding notes,
// scraper data or anything else internal.
export interface PublicGroup {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  isVerified: boolean;
  memberCount: number | null;
  meetingSchedule: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  category: { id: string; name: string; color: string | null };
}
