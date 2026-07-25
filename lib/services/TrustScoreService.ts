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
}