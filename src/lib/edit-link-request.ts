// SPDX-License-Identifier: AGPL-3.0-only

export const CONTACT_EMAIL = "fomo@yeti-dresden.org";

export interface EditLinkRequestCopy {
  subject: string;
  body: string;
  /** Labels for the copy-to-clipboard variant ("An", "Betreff"). */
  toLabel: string;
  subjectLabel: string;
}

export interface EditLinkRequestMail {
  to: string;
  subject: string;
  body: string;
}

/**
 * Mail asking the FOMO team for a (new) edit link for one group. Subject/body
 * come from the translations with {group}/{url} filled in, so the admin sees
 * at a glance which group it is about (Runbook 03).
 */
export function editLinkRequestMail(
  copy: EditLinkRequestCopy,
  group: { name: string; slug: string },
  publicSiteUrl: string,
): EditLinkRequestMail {
  const url = `${publicSiteUrl.replace(/\/$/, "")}/groups/${group.slug}/`;
  const fill = (s: string) => s.replaceAll("{group}", group.name).replaceAll("{url}", url);
  return { to: CONTACT_EMAIL, subject: fill(copy.subject), body: fill(copy.body) };
}

/** mailto: link that opens the mail program with the prefilled mail. */
export function editLinkRequestMailto(mail: EditLinkRequestMail): string {
  return (
    `mailto:${mail.to}` +
    `?subject=${encodeURIComponent(mail.subject)}` +
    `&body=${encodeURIComponent(mail.body)}`
  );
}

/** Plain text for copying into a webmailer (recipient and subject on top). */
export function editLinkRequestText(mail: EditLinkRequestMail, copy: EditLinkRequestCopy): string {
  return `${copy.toLabel}: ${mail.to}\n${copy.subjectLabel}: ${mail.subject}\n\n${mail.body}`;
}
