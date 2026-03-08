// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { getPilotDimensionsWithQuestions, getStandaloneQuestions } from "@/lib/queries/pilot";
import { DimensionManager } from "./DimensionManager";

export default async function PilotDimensionsPage() {
  const [dimensions, standalone] = await Promise.all([
    getPilotDimensionsWithQuestions(),
    getStandaloneQuestions(),
  ]);

  const serializedDimensions = dimensions.map((d) => ({
    id: d.id,
    label: d.label,
    emoji: d.emoji,
    description: d.description,
    blockIndex: d.blockIndex,
    order: d.order,
    questions: d.questions.map((q) => ({
      id: q.id,
      dimensionId: q.dimensionId,
      text: q.text,
      order: q.order,
      isInverse: q.isInverse,
    })),
  }));

  const serializedStandalone = standalone.map((q) => ({
    id: q.id,
    dimensionId: null as string | null,
    text: q.text,
    order: q.order,
    isInverse: q.isInverse,
  }));

  const totalQuestions = serializedDimensions.reduce((sum, d) => sum + d.questions.length, 0)
    + serializedStandalone.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/pilot"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Pilot-Dashboard
          </Link>
          <h1 className="font-heading text-2xl uppercase mt-1">
            Dimensionen & Fragen
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {serializedDimensions.length} Dimensionen, {totalQuestions} Fragen
            {serializedStandalone.length > 0 && ` (davon ${serializedStandalone.length} Standalone)`}
          </p>
        </div>
      </div>

      <DimensionManager
        initialDimensions={serializedDimensions}
        initialStandalone={serializedStandalone}
      />
    </div>
  );
}
