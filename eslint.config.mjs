// SPDX-License-Identifier: AGPL-3.0-only
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // New React Compiler rules in eslint-plugin-react-hooks 7 (Next 16).
      // Kept as warnings so the upgrade does not change behaviour; the
      // flagged spots are listed in TODO.md (DemoTour goes away in Phase 5).
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Separate project with its own config.
      "static-site/**",
    ],
  },
];

export default eslintConfig;
