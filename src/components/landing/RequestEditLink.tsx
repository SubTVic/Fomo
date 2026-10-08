// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CONTACT_EMAIL,
  editLinkRequestMail,
  editLinkRequestMailto,
  editLinkRequestText,
  type EditLinkRequestCopy,
} from "@/lib/edit-link-request";
import { PUBLIC_SITE_URL } from "@/lib/public-site";

export interface PickableGroup {
  name: string;
  slug: string;
}

/**
 * "Link beantragen" on the landing page: pick your group from a scrollable,
 * searchable list, then open a prefilled mail to the FOMO team. No server
 * round trip — the admin answers by hand (Runbook 03).
 * `groups === null` means the list could not be loaded → plain mail address.
 */
export function RequestEditLink({ groups }: { groups: PickableGroup[] | null }) {
  const t = useTranslations("landing.edit.request");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const panelId = useId();
  const listId = useId();

  const filtered = useMemo(() => {
    if (!groups) return [];
    const q = query.trim().toLocaleLowerCase("de");
    return q ? groups.filter((g) => g.name.toLocaleLowerCase("de").includes(q)) : groups;
  }, [groups, query]);

  const group = groups?.find((g) => g.slug === selected) ?? null;
  const mailCopy = t.raw("mail") as EditLinkRequestCopy;
  const mail = group ? editLinkRequestMail(mailCopy, group, PUBLIC_SITE_URL) : null;
  const mailText = mail ? editLinkRequestText(mail, mailCopy) : "";

  function select(slug: string) {
    setSelected(slug);
    setCopyState("idle");
  }

  // For webmail users (no mail program behind mailto:): copy recipient,
  // subject and text in one go. Clipboard can be blocked → show the text.
  async function copyMail() {
    try {
      await navigator.clipboard.writeText(mailText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  const mailLink = (chunks: React.ReactNode) => (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-foreground underline underline-offset-2">
      {chunks}
    </a>
  );

  return (
    // `contents`: button and panel become items of the surrounding section row,
    // so the open panel can wrap onto its own full-width line on desktop.
    <div className="contents">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full sm:w-auto sm:shrink-0 bg-foreground text-primary-foreground px-8 py-3 font-heading text-sm uppercase tracking-wider hover:bg-[#2a3a45] transition-colors text-center"
      >
        {open ? t("close") : t("button")}
      </button>

      {open && (
        <div id={panelId} className="w-full basis-full border-2 border-foreground bg-card p-4 sm:p-5">
          {groups === null ? (
            <p className="text-sm text-muted-foreground">
              {t.rich("fallback", { email: CONTACT_EMAIL, mail: mailLink })}
            </p>
          ) : (
            <>
              <label htmlFor={listId} className="mb-1 block text-xs font-semibold uppercase tracking-wider">
                {t("listLabel")}
              </label>
              <input
                id={listId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                autoComplete="off"
                className="w-full border-2 border-foreground bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
              />
              <div
                role="listbox"
                aria-label={t("listLabel")}
                className="mt-2 max-h-64 overflow-y-auto border-2 border-foreground"
              >
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">{t("empty")}</p>
                ) : (
                  filtered.map((g) => {
                    const isSelected = g.slug === selected;
                    return (
                      <button
                        key={g.slug}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => select(g.slug)}
                        className={`block w-full border-b border-foreground/15 px-3 py-2 text-left text-sm last:border-b-0 ${
                          isSelected ? "bg-foreground font-semibold text-white" : "hover:bg-muted"
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.rich("notListed", {
                  register: (chunks) => (
                    <Link href="/groups/register" className="font-semibold text-foreground underline underline-offset-2">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("hint")}</p>
              {mail ? (
                <div className="mt-3">
                  <a
                    href={editLinkRequestMailto(mail)}
                    className="block bg-foreground px-6 py-3 text-center font-heading text-sm uppercase tracking-wider text-primary-foreground transition-colors hover:bg-[#2a3a45]"
                  >
                    {t("submit")}
                  </a>
                  <p className="my-2 text-center text-xs uppercase tracking-wider text-muted-foreground">{t("or")}</p>
                  <button
                    type="button"
                    onClick={copyMail}
                    className="block w-full border-2 border-foreground px-6 py-3 text-center font-heading text-sm uppercase tracking-wider transition-colors hover:bg-foreground hover:text-primary-foreground"
                  >
                    {t("copy")}
                  </button>
                  <p role="status" className="mt-2 text-xs text-muted-foreground">
                    {copyState === "copied" ? t("copied") : copyState === "failed" ? t("copyFailed") : null}
                  </p>
                  {copyState === "failed" && (
                    <textarea
                      readOnly
                      value={mailText}
                      rows={9}
                      onFocus={(e) => e.currentTarget.select()}
                      className="mt-1 w-full border-2 border-foreground bg-card p-2 text-xs"
                    />
                  )}
                </div>
              ) : (
                <span
                  aria-disabled="true"
                  className="mt-3 block cursor-not-allowed bg-foreground/30 px-6 py-3 text-center font-heading text-sm uppercase tracking-wider text-primary-foreground"
                >
                  {t("submit")}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
