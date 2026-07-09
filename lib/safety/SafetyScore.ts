type SafetyScoreInput = {
  guardianCount: number;
  activeAlerts: number;
  hasRecentCriticalAlert: boolean;
};

export function calculateSafetyScore({
  guardianCount,
  activeAlerts,
  hasRecentCriticalAlert,
}: SafetyScoreInput) {
  let score = 100;

  if (guardianCount === 0) score -= 25;
  if (guardianCount === 1) score -= 10;

  score -= Math.min(activeAlerts * 5, 25);

  if (hasRecentCriticalAlert) score -= 25;

  score = Math.max(0, Math.min(score, 100));

  let label = "LOW RISK";
  let status: "safe" | "caution" | "danger" = "safe";

  if (score < 70) {
    label = "USE CAUTION";
    status = "caution";
  }

  if (score < 45) {
    label = "HIGH RISK";
    status = "danger";
  }

  return {
    score,
    label,
    status,
  };
}