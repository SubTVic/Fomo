// SPDX-License-Identifier: AGPL-3.0-only
// Max lengths of the group registration form, shared by the API schema and the
// form so the form can stop the user before the server rejects the request.

export const REGISTER_LIMITS = {
  name: 100,
  shortDescription: 200,
  motto: 150,
  contactPerson: 100,
  contactPersonRole: 100,
  meetingSchedule: 200,
  onboardingInfo: 2000,
  responsibleName: 100,
  responsibleRole: 100,
} as const;

export type LimitedField = keyof typeof REGISTER_LIMITS;

export function isWithinLimit(field: LimitedField, value: string): boolean {
  return value.trim().length <= REGISTER_LIMITS[field];
}
