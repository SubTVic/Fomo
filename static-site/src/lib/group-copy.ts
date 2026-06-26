// SPDX-License-Identifier: AGPL-3.0-only
import type { Group } from "./types";

export function groupCategory(group: Group, lang: "de" | "en") {
  if (lang === "de") return group.categoryName;
  return (
    {
      "Internationales": "International",
      "Kunst & Kultur": "Arts & culture",
      "Nachhaltigkeit": "Sustainability",
      "Politik & Gesellschaft": "Politics & society",
      "Sonstiges": "Other",
      "Soziales Engagement": "Social engagement",
      "Sport & Bewegung": "Sports & movement",
      "Technik & Wissenschaft": "Technology & science",
      "Wirtschaft & Karriere": "Business & career",
    }[group.categoryName] ?? group.categoryName
  );
}

export function groupShortText(group: Group, lang: "de" | "en") {
  if (lang === "de") return group.shortDescription || "";
  return englishSummary(group);
}

export function groupLongText(group: Group, lang: "de" | "en") {
  if (lang === "de") return group.longDescription || group.shortDescription || "";
  return englishLongSummary(group);
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
