// SPDX-License-Identifier: AGPL-3.0-only

import { redirect } from "next/navigation";
import { PUBLIC_QUIZ_URL } from "@/lib/public-site";

// Former study 2 intro page. Decommissioned: the live quiz runs on the public website.
export default function Study2IntroPage() {
  redirect(PUBLIC_QUIZ_URL);
}
