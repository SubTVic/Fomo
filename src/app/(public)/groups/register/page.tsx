// SPDX-License-Identifier: AGPL-3.0-only

import { Suspense } from "react";
import { AttributeChecklist } from "./AttributeChecklist";

export const metadata = {
  title: "Profil bestätigen – FOMO",
};

export default function GroupRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Laden…
        </div>
      }
    >
      <AttributeChecklist />
    </Suspense>
  );
}
