// SPDX-License-Identifier: AGPL-3.0-only
import type { Group, QuizFilters } from "@/lib/types";

interface GroupAttributesProps {
  group: Group;
  filters: QuizFilters;
  lang?: "de" | "en";
}

export function GroupAttributes({ group, filters, lang = "de" }: GroupAttributesProps) {
  const filterLabel = new Map(filters.options.map((option) => [option.attribute, option.label]));
  const labels = group.selfRating.filterSelections
    .map((attribute) => filterLabel.get(attribute) ?? attribute)
    .filter(Boolean);

  if (labels.length === 0) return null;

  return (
    <section className="mt-6 border-2 border-navy bg-surface p-4">
      <h2 className="font-heading text-sm uppercase text-navy">
        {lang === "en" ? "Attributes" : "Attribute"}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="border-2 border-navy bg-card px-3 py-1.5 text-sm font-semibold text-navy"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
