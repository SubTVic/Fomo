// SPDX-License-Identifier: AGPL-3.0-only
import type { Group } from "./types";
import { groupTranslations } from "./group-translations";
import { categoryLabel } from "./categories";

export function groupCategory(group: Group, lang: "de" | "en") {
  return categoryLabel(group.categoryName, lang);
}

/** Shown on /en next to a description that has no English version. */
export const GERMAN_ONLY_NOTE = "Description only available in German.";

function present(text: string | null | undefined): string {
  return text && text !== "null" ? text : "";
}

/**
 * True on /en when no hand-written English text exists and the German
 * description is shown instead (honest fallback, no machine word swapping).
 */
export function isGermanOnly(group: Group, lang: "de" | "en") {
  return (
    lang === "en" &&
    !groupTranslations[group.slug] &&
    Boolean(present(group.longDescription) || present(group.shortDescription))
  );
}

export function groupShortText(group: Group, lang: "de" | "en") {
  if (lang === "de") return present(group.shortDescription);
  if (groupTranslations[group.slug]) return firstParagraph(groupTranslations[group.slug]);
  return present(group.shortDescription) || present(group.longDescription) || englishSummary(group);
}

export function groupLongText(group: Group, lang: "de" | "en") {
  if (lang === "de") return present(group.longDescription) || present(group.shortDescription);
  if (groupTranslations[group.slug]) return groupTranslations[group.slug];
  return present(group.longDescription) || present(group.shortDescription) || englishLongSummary(group);
}

function firstParagraph(text: string) {
  return text.split(/\n\s*\n/)[0] ?? text;
}

function englishSummary(group: Group) {
  const category = groupCategory(group, "en").toLowerCase();
  const rhythm = group.eventFrequency ? ` It usually meets ${frequency(group.eventFrequency)}.` : "";
  const language = group.language ? ` The group language is ${languageLabel(group.language)}.` : "";
  return `${group.name} is a TU Dresden student group in ${category}.${rhythm}${language}`;
}

function englishLongSummary(group: Group) {
  const parts = [englishSummary(group)];
  if (group.memberCount) parts.push(`It has about ${group.memberCount} members.`);
  if (group.groupSize) parts.push(`Its size is ${sizeLabel(group.groupSize)}.`);
  if (group.motto) parts.push(`Motto: "${group.motto}"`);
  return parts.join("\n\n");
}

function frequency(value: string) {
  return { high: "weekly", medium: "monthly", low: "occasionally" }[value] ?? value;
}

function languageLabel(value: string) {
  return { german: "German", english: "English", both: "German and English" }[value] ?? value;
}

function sizeLabel(value: string) {
  return { small: "small", medium: "medium", large: "large" }[value] ?? value;
}
