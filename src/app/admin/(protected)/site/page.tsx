// SPDX-License-Identifier: AGPL-3.0-only

import { getSiteConfig } from "@/lib/queries/site-config";
import { SiteConfigEditor } from "./SiteConfigEditor";

export const dynamic = "force-dynamic";

export default async function SiteConfigPage() {
  const config = await getSiteConfig();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl uppercase mb-8">
        Landing Page bearbeiten
      </h1>
      <SiteConfigEditor initialConfig={config} />
    </div>
  );
}
