// SPDX-License-Identifier: AGPL-3.0-only

"use client";

const buttonClass =
  "border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-foreground hover:text-primary-foreground transition-colors";

export default function ExportButton() {
  return (
    <div className="flex flex-row gap-2">
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          window.location.href = "/api/pilot/admin-export?format=csv";
        }}
      >
        CSV
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          window.location.href = "/api/pilot/admin-export?format=json";
        }}
      >
        JSON
      </button>
    </div>
  );
}
