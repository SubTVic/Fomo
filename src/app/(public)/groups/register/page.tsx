// SPDX-License-Identifier: AGPL-3.0-only

import { Suspense } from "react";
import { GroupRegisterForm } from "./GroupRegisterForm";

export const metadata = {
  title: "Gruppe registrieren – FOMO",
};

export default function GroupRegisterPage() {
  return (
    <Suspense>
      <GroupRegisterForm />
    </Suspense>
  );
}
