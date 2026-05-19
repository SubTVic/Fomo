// SPDX-License-Identifier: AGPL-3.0-only

import { getQuizGroups } from "@/lib/queries/quiz";
import { DemoTour } from "@/components/demo/DemoTour";
import { DEMO_THESES } from "@/components/demo/demo-theses";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const groups = await getQuizGroups();

  return <DemoTour theses={DEMO_THESES} groups={groups} />;
}
