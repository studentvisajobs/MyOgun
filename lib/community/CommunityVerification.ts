import { prisma } from "@/lib/prisma";

export class CommunityVerification {
  static async recalculate(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: {
        id: incidentId,
      },
      include: {
        evidence: true,
        confirmations: true,
      },
    });

    if (!incident) return null;

    let score = 20;

    // Evidence scoring
    for (const evidence of incident.evidence) {
      switch (evidence.type) {
        case "PHOTO":
          score += 15;
          break;

        case "VIDEO":
          score += 25;
          break;

        case "AUDIO":
          score += 10;
          break;
      }
    }

    // Community votes
    const confirms = incident.confirmations.filter(
      (vote) => vote.vote === "CONFIRM"
    ).length;

    const falseReports = incident.confirmations.filter(
      (vote) => vote.vote === "FALSE_REPORT"
    ).length;

    score += confirms * 10;
    score -= falseReports * 15;

    score = Math.max(0, Math.min(100, score));

    let status = incident.status;

    if (score >= 90) {
      status = "CRITICAL";
    } else if (score >= 70) {
      status = "VERIFIED";
    } else if (score <= 5) {
      status = "FALSE";
    } else {
      status = "PENDING";
    }

    return prisma.incident.update({
      where: {
        id: incidentId,
      },
      data: {
        confidenceScore: score,
        status,
      },
    });
  }
}