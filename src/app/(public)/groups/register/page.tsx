// SPDX-License-Identifier: AGPL-3.0-only

import { Suspense } from "react";
import { GroupSelfRatingQuiz } from "./GroupSelfRatingQuiz";
import { GroupRegisterForm } from "./GroupRegisterForm";

export const metadata = {
  title: "Gruppe registrieren – FOMO",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function GroupRegisterPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (token) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            Laden…
          </div>
        }
      >
        <GroupSelfRatingQuiz />
      </Suspense>
    );
  }

  return <GroupRegisterForm />;
}
