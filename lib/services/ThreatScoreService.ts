import { prisma } from "@/lib/prisma";

const INCIDENT_WEIGHTS: Record<string, number> = {
  ROBBERY: 10,
  KIDNAPPING: 10,
  FIRE: 7,
  FLOOD: 6,
  ACCIDENT: 4,
  ROAD_BLOCK: 3,
  MISSING_PERSON: 6,
  SUSPICIOUS_ACTIVITY: 5,
  OTHER: 2,
};

export class ThreatScoreService {
  static calculate(params: {
    type: string;
    confidenceScore: number;
    confirmations: number;
    evidenceCount: number;
    isCritical: boolean;
  }) {
    const weight =
      INCIDENT_WEIGHTS[params.type] ?? 2;

    let score = weight * 5;

    score += params.confidenceScore * 0.4;

    score += params.confirmations * 8;

    score += params.evidenceCount * 6;

    if (params.isCritical) {
      score += 15;
    }

    score = Math.min(100, Math.round(score));

    let level:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "CRITICAL";

    if (score >= 85) {
      level = "CRITICAL";
    } else if (score >= 65) {
      level = "HIGH";
    } else if (score >= 40) {
      level = "MEDIUM";
    } else {
      level = "LOW";
    }

    return {
      score,
      level,
    };
  }
}