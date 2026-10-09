
type Props = {
  userName: string;
  activeAlerts: number;
  guardianCount: number;
  emergencyActive: boolean;
};

export default function SafetyStatusHero({
  userName,
  activeAlerts,
  guardianCount,
  emergencyActive,
}: Props) {
  const hasAlerts = activeAlerts > 0;
  const showEmergency = emergencyActive || hasAlerts;

  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-2xl transition-colors duration-300 ${
        emergencyActive
          ? "border-red-500/60 bg-gradient-to-br from-[#45080e] via-[#23070b] to-black"
          : "border-emerald-500/20 bg-gradient-to-br from-[#061f16] via-[#07110d] to-black"
      }`}
    >
      <p
        className={`text-sm font-black tracking-[0.3em] ${
          emergencyActive
            ? "text-red-300"
            : "text-emerald-400"
        }`}
      >
        MYOGUN
      </p>

      <h1 className="mt-4 text-4xl font-black text-white">
        Good day, {userName}
      </h1>

      <div
        className={`mt-6 rounded-[2rem] border p-6 text-center ${
          emergencyActive
            ? "border-red-500/40 bg-red-950/30"
            : "border-emerald-500/20 bg-black/40"
        }`}
      >
        <div
          className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border ${
            showEmergency
              ? "border-red-500 bg-red-500/10"
              : "border-emerald-500 bg-emerald-500/10"
          }`}
        >
          <span className="text-6xl" aria-hidden="true">
            {showEmergency ? "🚨" : "🛡️"}
          </span>
        </div>

        <h2
          className={`mt-5 text-3xl font-black ${
            showEmergency
              ? "text-red-400"
              : "text-emerald-400"
          }`}
        >
          {emergencyActive
            ? "SILENT SOS ACTIVE"
            : hasAlerts
              ? "ACTIVE INCIDENT ALERTS"
              : "SAFETY MONITORING ACTIVE"}
        </h2>

        {emergencyActive && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/40 p-4"
          >
            <p className="font-bold text-red-200">
              Emergency session activated
            </p>

            <p className="mt-2 text-sm text-red-100/80">
              Your Silent SOS emergency session is active.
              Guardian notification delivery has not been
              verified.
            </p>
          </div>
        )}

        {hasAlerts && (
          <p className="mt-3 text-sm text-white/70">
            {activeAlerts} active incident alert
            {activeAlerts !== 1 ? "s" : ""} recorded.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/40 p-4">
            <p
              className={`text-2xl font-black ${
                emergencyActive
                  ? "text-red-300"
                  : "text-emerald-400"
              }`}
            >
              {guardianCount}
            </p>

            <p className="text-xs text-white/50">
              Guardians
            </p>
          </div>

          <div className="rounded-2xl bg-black/40 p-4">
            <p
              className={`text-2xl font-black ${
                hasAlerts
                  ? "text-red-400"
                  : "text-white/50"
              }`}
            >
              {activeAlerts}
            </p>

            <p className="text-xs text-white/50">
              Active Alerts
            </p>
          </div>
        </div>

        {emergencyActive && (
          <p className="mt-4 text-xs text-red-200/70">
            Emergency Red Mode will clear when the
            emergency session is stopped or resolved.
          </p>
        )}
      </div>
    </section>
  );
}
