import { prisma } from "@/lib/prisma";

export class TrustScoreService {
  static calculate(params: {
    confirmedReports: number;
    falseReports: number;
    verifiedReports: number;
    evidenceUploads: number;
  }) {
    let score = 50;

    score += params.confirmedReports * 2;
    score += params.verifiedReports * 4;
    score += params.evidenceUploads;
    score -= params.falseReports * 5;

    score = Math.max(0, Math.min(100, score));

    let level:
      | "NEW"
      | "TRUSTED"
      | "HIGHLY_TRUSTED";

    if (score >= 85) {
      level = "HIGHLY_TRUSTED";
    } else if (score >= 65) {
      level = "TRUSTED";
    } else {
      level = "NEW";
    }

    return {
      score,
      level,
    };
  }

  static async updateUserTrust(userId: string) {
    const confirmations =
      await prisma.confirmation.findMany({
        where: {
          userId,
        },
        include: {
          incident: true,
        },
      });

    const confirmedReports =
      confirmations.filter(
        (item) => item.vote === "CONFIRM"
      ).length;

    const falseReports =
      confirmations.filter(
        (item) =>
          item.vote === "FALSE_REPORT"
      ).length;

    const verifiedReports =
      confirmations.filter(
        (item) =>
          item.vote === "CONFIRM" &&
          (
            item.incident.status === "VERIFIED" ||
            item.incident.status === "CRITICAL"
          )
      ).length;

    const trust = this.calculate({
      confirmedReports,
      falseReports,
      verifiedReports,
      evidenceUploads: 0,
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        trustScore: trust.score,
        confirmedReports,
        falseReports,
        verifiedReports,
      },
    });

    return trust;
  }
}