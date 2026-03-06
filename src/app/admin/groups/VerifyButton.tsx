// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerifyButton({
  groupId,
  isVerified,
}: {
  groupId: string;
  isVerified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/groups/${groupId}/verify`, { method: "PATCH" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        isVerified
          ? "bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800"
          : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-800"
      }`}
    >
      {loading ? "…" : isVerified ? "Verifiziert ✓" : "Verifizieren"}
    </button>
  );
}
