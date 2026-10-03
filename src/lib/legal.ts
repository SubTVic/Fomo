// SPDX-License-Identifier: AGPL-3.0-only
// Operator details for /impressum and /datenschutz of this app. Must match the
// public site (static-site/src/app/impressum/page.tsx and datenschutz/page.tsx);
// change both together when the operator changes (Umsetzungsplan WP-7.2).

export const OPERATOR = {
  name: "Victor Kling",
  street: "Katharinenstraße 17",
  city: "01099 Dresden",
  email: "fomo@yeti-dresden.org",
} as const;

export const OPERATOR_ADDRESS = `${OPERATOR.name}\n${OPERATOR.street}\n${OPERATOR.city}`;
