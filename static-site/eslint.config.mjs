// SPDX-License-Identifier: AGPL-3.0-only
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // New in eslint-plugin-react-hooks 7. The flagged effects are deliberate:
      // a static export can only read window.location after hydration, and two
      // effects reset animation state. Kept as a warning until they are
      // refactored (TODO.md), so this upgrade does not change quiz behaviour.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
