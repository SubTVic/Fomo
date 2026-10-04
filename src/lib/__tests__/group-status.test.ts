// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from "vitest";
import { RegistrationStatus } from "@prisma/client";
import { groupStatus, groupStatusKey, type GroupStatusInput } from "@/lib/group-status";

const base: GroupStatusInput = {
  isActive: true,
  isVerified: false,
  registrationStatus: null,
  selfRatingAnswers: 0,
};

describe("groupStatusKey", () => {
  it("hidden wins over everything", () => {
    expect(groupStatusKey({ ...base, isActive: false, isVerified: true, selfRatingAnswers: 21 })).toBe("hidden");
  });

  it("verified with own profile is in the quiz (same rule as the export)", () => {
    expect(groupStatusKey({ ...base, isVerified: true, selfRatingAnswers: 21 })).toBe("quiz");
  });

  it("verified without own profile is only in the directory", () => {
    expect(groupStatusKey({ ...base, isVerified: true })).toBe("directory");
  });

  it("verified groups stay in the quiz while their edits are logged (E1)", () => {
    expect(
      groupStatusKey({ ...base, isVerified: true, selfRatingAnswers: 21, registrationStatus: RegistrationStatus.SUBMITTED }),
    ).toBe("quiz");
  });

  it("unverified submissions need a review", () => {
    expect(groupStatusKey({ ...base, registrationStatus: RegistrationStatus.SUBMITTED, selfRatingAnswers: 21 })).toBe("review");
  });

  it("invited and never-contacted groups are told apart", () => {
    expect(groupStatusKey({ ...base, registrationStatus: RegistrationStatus.INVITED })).toBe("invited");
    expect(groupStatusKey(base)).toBe("unconfirmed");
  });
});

describe("groupStatus", () => {
  it("returns one label and an explanation for every status", () => {
    const s = groupStatus({ ...base, isVerified: true, selfRatingAnswers: 21 });
    expect(s).toMatchObject({ key: "quiz", label: "Im Quiz" });
    expect(s.hint.length).toBeGreaterThan(20);
  });
});
