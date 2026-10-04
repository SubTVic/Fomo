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
      className={`rounded border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        isVerified
          ? "border-red-300 text-red-700 hover:bg-red-50"
          : "border-green-600 bg-green-50 text-green-800 hover:bg-green-100"
      }`}
    >
      {loading ? "…" : isVerified ? "Verifizierung aufheben" : "Verifizieren"}
    </button>
  );
}
