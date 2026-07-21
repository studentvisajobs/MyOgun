"use client";

import {
  GuardianIntelligence,
  type GuardianDashboardInput,
} from "@/lib/intelligence/GuardianIntelligence";

type Props = {
  dashboard: GuardianDashboardInput;
};

function riskColour(level: string) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-600";

    case "HIGH":
      return "bg-orange-500";

    case "MODERATE":
      return "bg-yellow-500";

    default:
      return "bg-green-600";
  }
}

function alertIcon(severity: string) {
  switch (severity) {
    case "critical":
      return "🔴";

    case "warning":
      return "🟠";

    default:
      return "🟡";
  }
}

export default function GuardianIntelligenceCard({
  dashboard,
}: Props) {
  const assessment =
    GuardianIntelligence.analyse(dashboard);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-xl font-bold text-white">
          🧠 Guardian Intelligence
        </h2>

        <p className="mt-1 text-sm text-white/50">
          AI-assisted assessment of the current
          emergency session.
        </p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div>
          <p className="text-sm text-white/50">
            Risk Level
          </p>

          <div
            className={`mt-3 inline-flex rounded-full px-5 py-2 font-bold text-white ${riskColour(
              assessment.riskLevel
            )}`}
          >
            {assessment.riskLevel}
          </div>

          <p className="mt-5 text-sm text-white/50">
            Risk Score
          </p>

          <p className="mt-2 text-4xl font-black text-white">
            {assessment.score}
            <span className="text-xl text-white/50">
              /100
            </span>
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white">
            Alerts
          </h3>

          <div className="mt-3 space-y-3">
            {assessment.alerts.length === 0 ? (
              <p className="text-sm text-green-400">
                ✅ No active alerts.
              </p>
            ) : (
              assessment.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="font-semibold text-white">
                    {alertIcon(alert.severity)}{" "}
                    {alert.title}
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {alert.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5">
        <h3 className="font-bold text-white">
          Recommendations
        </h3>

        <div className="mt-3 space-y-2">
          {assessment.recommendations.length === 0 ? (
            <p className="text-sm text-white/50">
              No recommendations.
            </p>
          ) : (
            assessment.recommendations.map(
              (recommendation, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-white/5 px-4 py-3 text-sm text-white"
                >
                  ☑ {recommendation}
                </div>
              )
            )
          )}
        </div>
      </div>
    </section>
  );
}