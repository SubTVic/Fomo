// SPDX-License-Identifier: AGPL-3.0-only

// The public FOMO website (static export in static-site/). Quiz and directory
// live there; old URLs of this app redirect to it (next.config.ts).
export const PUBLIC_SITE_URL = "https://www.fomo-dresden.app";

// Where admins start the "Daten-Sync" workflow (WP-4.5) that brings DB changes
// to the public site. Update when the repository moves (Umsetzungsplan WP-7.1).
export const SYNC_WORKFLOW_URL = "https://github.com/SubTVic/Fomo/actions/workflows/sync-groups.yml";
