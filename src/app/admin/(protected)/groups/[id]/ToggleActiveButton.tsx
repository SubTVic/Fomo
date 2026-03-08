// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ToggleActiveButton({
  groupId,
  isActive,
}: {
  groupId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/groups/${groupId}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`font-heading uppercase px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? "border-2 border-red-600 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-2 border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
      }`}
    >
      {loading ? "..." : isActive ? "Deaktivieren" : "Aktivieren"}
    </button>
  );
}
