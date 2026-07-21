export type RiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL";

export type AlertSeverity =
  | "info"
  | "warning"
  | "critical";

export type GuardianAlert = {
  severity: AlertSeverity;
  title: string;
  message: string;
};

export type GuardianAssessment = {
  score: number;
  riskLevel: RiskLevel;
  alerts: GuardianAlert[];
  recommendations: string[];
};

export type GuardianDashboardInput = {
  session: {
    status: string;
    batteryLevel?: number | null;
  };

  summary: {
    responderCount: number;
    acknowledgementCount: number;
    evidenceCount: number;
  };

  latestLocation: {
    accuracy?: number | null;
    createdAt: string;
  } | null;
};

export class GuardianIntelligence {
  static analyse(
    dashboard: GuardianDashboardInput
  ): GuardianAssessment {
    let score = 0;

    const alerts: GuardianAlert[] = [];

    const recommendations = new Set<string>();

    const battery =
      dashboard.session.batteryLevel;

    //------------------------------------
    // Battery
    //------------------------------------

    if (
      battery !== null &&
      battery !== undefined
    ) {
      if (battery <= 10) {
        score += 30;

        alerts.push({
          severity: "critical",
          title: "Battery critically low",
          message:
            "Device battery is below 10%.",
        });

        recommendations.add(
          "Call the user immediately."
        );
      } else if (battery <= 20) {
        score += 20;

        alerts.push({
          severity: "warning",
          title: "Low battery",
          message:
            "Battery is below 20%.",
        });
      } else if (battery <= 40) {
        score += 10;

        alerts.push({
          severity: "info",
          title: "Battery dropping",
          message:
            "Battery is below 40%.",
        });
      }
    }

    //------------------------------------
    // Guardian acknowledgement
    //------------------------------------

    if (
      dashboard.summary
        .acknowledgementCount === 0
    ) {
      score += 20;

      alerts.push({
        severity: "critical",
        title: "No guardian acknowledgement",
        message:
          "Nobody has acknowledged this emergency.",
      });

      recommendations.add(
        "Notify another guardian."
      );
    } else if (
      dashboard.summary
        .acknowledgementCount === 1
    ) {
      score += 10;

      alerts.push({
        severity: "warning",
        title: "Limited acknowledgement",
        message:
          "Only one guardian has acknowledged.",
      });
    }

    //------------------------------------
    // GPS
    //------------------------------------

    if (!dashboard.latestLocation) {
      score += 25;

      alerts.push({
        severity: "critical",
        title: "GPS unavailable",
        message:
          "No location has been received.",
      });

      recommendations.add(
        "Request updated location."
      );
    } else if (
      dashboard.latestLocation.accuracy &&
      dashboard.latestLocation.accuracy > 50
    ) {
      score += 10;

      alerts.push({
        severity: "warning",
        title: "Poor GPS accuracy",
        message:
          "Current GPS accuracy is low.",
      });
    }

    //------------------------------------
    // Evidence
    //------------------------------------

    if (
      dashboard.summary.evidenceCount === 0
    ) {
      alerts.push({
        severity: "info",
        title: "No evidence captured",
        message:
          "No photos, videos or audio have been uploaded.",
      });

      recommendations.add(
        "Ask the user to capture evidence if safe."
      );
    }

    //------------------------------------
    // Session
    //------------------------------------

    if (
      dashboard.session.status !== "ACTIVE"
    ) {
      alerts.push({
        severity: "info",
        title: "Session inactive",
        message:
          "Guardian Mode session is no longer active.",
      });
    }

    //------------------------------------
    // Clamp score
    //------------------------------------

    score = Math.min(score, 100);

    let riskLevel: RiskLevel = "LOW";

    if (score >= 81) {
      riskLevel = "CRITICAL";
    } else if (score >= 51) {
      riskLevel = "HIGH";
    } else if (score >= 21) {
      riskLevel = "MODERATE";
    }

    return {
      score,
      riskLevel,
      alerts,
      recommendations: Array.from(
        recommendations
      ),
    };
  }
}