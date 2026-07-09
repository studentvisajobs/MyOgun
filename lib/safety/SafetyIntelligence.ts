export type SafetySnapshot = {
  guardianCount: number;
  nearbyAlerts: number;
  sharingLocation: boolean;
  activeJourney: boolean;
  emergencyContacts: number;
};

export type SafetyBrief = {
  title: string;
  summary: string;
  recommendation: string;
  score: number;
};

export function generateSafetyBrief(
  snapshot: SafetySnapshot
): SafetyBrief {
  let score = 100;
  const messages: string[] = [];
  const recommendations: string[] = [];

  if (snapshot.nearbyAlerts > 0) {
    score -= 25;
    messages.push(
      `${snapshot.nearbyAlerts} nearby incident${
        snapshot.nearbyAlerts > 1 ? "s" : ""
      } detected.`
    );
    recommendations.push("Avoid affected areas.");
  } else {
    messages.push("No nearby danger detected.");
  }

  if (snapshot.guardianCount === 0) {
    score -= 10;
    recommendations.push("Add trusted guardians.");
  } else {
    messages.push(
      `${snapshot.guardianCount} guardian${
        snapshot.guardianCount > 1 ? "s are" : " is"
      } available.`
    );
  }

  if (!snapshot.sharingLocation) {
    score -= 10;
    recommendations.push("Enable live location sharing.");
  } else {
    messages.push("Location sharing is active.");
  }

  if (snapshot.activeJourney) {
    messages.push("Safe Journey monitoring is active.");
  }

  if (snapshot.emergencyContacts === 0) {
    score -= 10;
    recommendations.push("Add emergency contacts.");
  }

  score = Math.max(0, score);

  return {
    title: score >= 90 ? "Everything looks normal" : "Attention Recommended",
    summary: messages.join(" "),
    recommendation:
      recommendations.length > 0
        ? recommendations.join(" ")
        : "You are fully protected.",
    score,
  };
}