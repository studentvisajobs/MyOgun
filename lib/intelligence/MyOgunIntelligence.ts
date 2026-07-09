export type MyOgunSnapshot = {
  guardianCount: number;
  nearbyAlerts: number;
  sharingLocation: boolean;
  activeJourney: boolean;
  emergencyContacts: number;
};

export function generateMyOgunIntelligence(snapshot: MyOgunSnapshot) {
  let score = 100;
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (snapshot.nearbyAlerts > 0) {
    score -= 25;
    insights.push(`${snapshot.nearbyAlerts} nearby alert detected.`);
    recommendations.push("Avoid affected areas and stay alert.");
  } else {
    insights.push("No nearby danger detected.");
  }

  if (snapshot.guardianCount > 0) {
    insights.push(`${snapshot.guardianCount} guardian ready.`);
  } else {
    score -= 10;
    insights.push("No guardian connected.");
    recommendations.push("Add at least one trusted guardian.");
  }

  if (snapshot.sharingLocation) {
    insights.push("Live location sharing is active.");
  } else {
    score -= 10;
    recommendations.push("Enable live location sharing.");
  }

  if (snapshot.activeJourney) {
    insights.push("Safe Journey monitoring is active.");
  } else {
    insights.push("No active journey.");
  }

  if (snapshot.emergencyContacts === 0) {
    score -= 10;
    recommendations.push("Add emergency contacts.");
  }

  score = Math.max(0, score);

  return {
    score,
    title: score >= 90 ? "Everything looks normal" : "Attention recommended",
    summary: insights.join(" "),
    recommendation:
      recommendations.length > 0
        ? recommendations.join(" ")
        : "You are fully protected.",
  };
}