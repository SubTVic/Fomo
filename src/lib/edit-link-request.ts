// SPDX-License-Identifier: AGPL-3.0-only

export const CONTACT_EMAIL = "fomo@yeti-dresden.org";

export interface EditLinkRequestCopy {
  subject: string;
  body: string;
}

/**
 * mailto: link asking the FOMO team for a (new) edit link for one group.
 * Subject/body come from the translations with {group}/{url} filled in, so the
 * admin sees at a glance which group it is about (Runbook 03).
 */
export function editLinkRequestMailto(
  copy: EditLinkRequestCopy,
  group: { name: string; slug: string },
  publicSiteUrl: string,
): string {
  const url = `${publicSiteUrl.replace(/\/$/, "")}/groups/${group.slug}/`;
  const fill = (s: string) => s.replaceAll("{group}", group.name).replaceAll("{url}", url);
  return (
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(fill(copy.subject))}` +
    `&body=${encodeURIComponent(fill(copy.body))}`
  );
}
