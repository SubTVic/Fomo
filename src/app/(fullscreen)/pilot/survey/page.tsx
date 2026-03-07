// SPDX-License-Identifier: AGPL-3.0-only
// Pilot survey page — renders the variant-aware SurveyRouter
// The ?variant= param is handled client-side inside SurveyRouter

import { Suspense } from "react";
import { SurveyRouter } from "@/components/survey/SurveyRouter";

export const metadata = {
  title: "FOMO Pilot – Umfrage",
  description: "Hilf uns, FOMO besser zu machen. Beantworte 60 kurze Fragen.",
};

export default function PilotSurveyPage() {
  return (
    <Suspense>
      <SurveyRouter />
    </Suspense>
  );
}
