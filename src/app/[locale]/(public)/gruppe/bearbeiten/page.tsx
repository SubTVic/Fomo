// SPDX-License-Identifier: AGPL-3.0-only

import { Suspense } from "react";
import type { Metadata } from "next";
import { GroupSelfRatingQuiz } from "../../groups/register/GroupSelfRatingQuiz";

export const metadata: Metadata = {
  title: "Gruppenprofil bearbeiten – FOMO",
  robots: { index: false, follow: false },
};

/** Reusable edit link (WP-4.2): /gruppe/bearbeiten?token=… */
export default function EditGroupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground">Laden…</div>
      }
    >
      <GroupSelfRatingQuiz />
    </Suspense>
  );
}
