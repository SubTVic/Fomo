// SPDX-License-Identifier: AGPL-3.0-only
// Response types for the pilot statistics API

import type { ItemStats, DimensionStats, RedundancyPair } from "@/lib/pilot-statistics";

export interface PilotStatisticsResponse {
  overview: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number; // 0–100
    avgDurationMinutes: number;
    avgQuestionsAnswered: number;
  };

  demographics: {
    semester: Record<string, number>;
    membership: Record<string, number>;
    preferredVariant: Record<string, number>;
  };

  items: ItemStats[];
  dimensions: DimensionStats[];
  redundancies: RedundancyPair[];
}

export type { ItemStats, DimensionStats, RedundancyPair };
