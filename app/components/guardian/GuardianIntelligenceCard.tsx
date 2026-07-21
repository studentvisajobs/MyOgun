"use client";

import {
  GuardianIntelligence,
  type GuardianDashboardInput,
} from "@/lib/intelligence/GuardianIntelligence";

type GuardianIntelligenceCardProps = {
  dashboard: GuardianDashboardInput;
};

function getRiskClasses(level: string) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-600 text-white";

    case "HIGH":
      return "bg-orange-500 text-white";

    case "MODERATE":
      return "bg-yellow-500 text-black";

    default:
      return "bg-green-600 text-white";
  }
}

function getAlertIcon(severity: string) {
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
}: GuardianIntelligenceCardProps) {
  const assessment =
    GuardianIntelligence.analyse(dashboard);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-xl font-bold text-white">
          🧠 Guardian Intelligence
        </h2>

        <p className="mt-1 text-sm text-white/50">
          Automated assessment of the current emergency
          session.
        </p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm text-white/50">
            Risk level
          </p>

          <div
            className={`mt-3 inline-flex rounded-full px-5 py-2 text-sm font-black tracking-wide ${getRiskClasses(
              assessment.riskLevel
            )}`}
          >
            {assessment.riskLevel}
          </div>

          <p className="mt-6 text-sm text-white/50">
            Risk score
          </p>

          <p className="mt-2 text-5xl font-black text-white">
            {assessment.score}
            <span className="ml-1 text-xl text-white/40">
              /100
            </span>
          </p>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${getRiskClasses(
                assessment.riskLevel
              )}`}
              style={{
                width: `${assessment.score}%`,
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-white">
            Active alerts
          </h3>

          {assessment.alerts.length === 0 ? (
            <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="font-semibold text-green-300">
                ✅ No active alerts
              </p>

              <p className="mt-1 text-sm text-green-200/60">
                No immediate risks were detected from the
                available session data.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {assessment.alerts.map(
                (alert, index) => (
                  <article
                    key={`${alert.title}-${index}`}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {getAlertIcon(
                          alert.severity
                        )}
                      </span>

                      <div>
                        <p className="font-semibold text-white">
                          {alert.title}
                        </p>

                        <p className="mt-1 text-sm text-white/60">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5">
        <h3 className="font-bold text-white">
          Recommended actions
        </h3>

        {assessment.recommendations.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            No additional action is recommended at this
            time.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {assessment.recommendations.map(
              (recommendation, index) => (
                <div
                  key={`${recommendation}-${index}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
                >
                  ☑ {recommendation}
                </div>
              )
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-black/20 px-5 py-3">
        <p className="text-xs text-white/35">
          Assessment is based on battery, GPS,
          acknowledgement, evidence and session status
          data.
        </p>
      </div>
    </section>
  );
}