// SPDX-License-Identifier: AGPL-3.0-only

// The public FOMO website (static export in static-site/). The quiz lives
// there; the legacy quiz/pilot/demo pages of this app redirect to it.
export const PUBLIC_SITE_URL = "https://www.fomo-dresden.app";
export const PUBLIC_QUIZ_URL = `${PUBLIC_SITE_URL}/quiz/`;

// Where admins start the "Daten-Sync" workflow (WP-4.5) that brings DB changes
// to the public site. Update when the repository moves (Umsetzungsplan WP-7.1).
export const SYNC_WORKFLOW_URL = "https://github.com/SubTVic/Fomo/actions/workflows/sync-groups.yml";
