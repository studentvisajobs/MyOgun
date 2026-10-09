
type Props = {
  userName: string;
  activeAlerts: number;
  guardianCount: number;
  emergencyActive: boolean;
  guardianEmergencyName?: string | null;
};

export default function SafetyStatusHero({
  userName,
  activeAlerts,
  guardianCount,
  emergencyActive,
  guardianEmergencyName = null,
}: Props) {
  const hasAlerts = activeAlerts > 0;
  const guardianNeedsHelp = Boolean(guardianEmergencyName);

  const redMode = emergencyActive || guardianNeedsHelp;
  const showAlert = redMode || hasAlerts;

  const statusTitle = emergencyActive
    ? "SILENT SOS ACTIVE"
    : guardianNeedsHelp
      ? "GUARDIAN NEEDS HELP"
      : hasAlerts
        ? "ACTIVE INCIDENT ALERTS"
        : "SAFETY MONITORING ACTIVE";

  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-2xl transition-colors duration-300 ${
        redMode
          ? "border-red-500/60 bg-gradient-to-br from-[#45080e] via-[#23070b] to-black"
          : "border-emerald-500/20 bg-gradient-to-br from-[#061f16] via-[#07110d] to-black"
      }`}
    >
      <p
        className={`text-sm font-black tracking-[0.3em] ${
          redMode ? "text-red-300" : "text-emerald-400"
        }`}
      >
        MYOGUN
      </p>

      <h1 className="mt-4 text-4xl font-black text-white">
        Good day, {userName}
      </h1>

      <div
        className={`mt-6 rounded-[2rem] border p-6 text-center ${
          redMode
            ? "border-red-500/40 bg-red-950/30"
            : "border-emerald-500/20 bg-black/40"
        }`}
      >
        <div
          className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border ${
            showAlert
              ? "border-red-500 bg-red-500/10"
              : "border-emerald-500 bg-emerald-500/10"
          }`}
        >
          <span
            className={`text-6xl ${
              showAlert ? "text-red-400" : "text-emerald-400"
            }`}
            aria-hidden="true"
          >
            {showAlert ? "!" : "✓"}
          </span>
        </div>

        <h2
          className={`mt-5 text-3xl font-black ${
            showAlert ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {statusTitle}
        </h2>

        {emergencyActive && (
          <div
            role="status"
            className="mt-4 rounded-2xl border border-red-500/40 bg-red-950/40 p-4"
          >
            <p className="font-bold text-red-200">
              Your emergency session is active
            </p>

            <p className="mt-2 text-sm text-red-100/80">
              Your Silent SOS emergency session has been
              activated. Guardian notification delivery
              has not been verified.
            </p>
          </div>
        )}

        {guardianNeedsHelp && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-500/50 bg-red-950/50 p-5 text-left"
          >
            <p className="text-sm font-black uppercase tracking-wider text-red-300">
              Guardian Network Emergency
            </p>

            <p className="mt-3 text-xl font-black text-white">
              {guardianEmergencyName} needs your attention
            </p>

            <p className="mt-2 text-sm leading-6 text-red-100/80">
              Someone connected to your Guardian Network
              has an active emergency session.
              Open Guardian Circle to review their
              available safety information and location.
            </p>

            <a
              href="/guardian-circle"
              className="mt-5 inline-flex rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-400"
            >
              View Guardian Circle
            </a>
          </div>
        )}

        {hasAlerts && (
          <p className="mt-4 text-sm text-white/70">
            {activeAlerts} active incident alert
            {activeAlerts !== 1 ? "s" : ""} recorded.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/40 p-4">
            <p
              className={`text-2xl font-black ${
                redMode ? "text-red-300" : "text-emerald-400"
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
                hasAlerts ? "text-red-400" : "text-white/50"
              }`}
            >
              {activeAlerts}
            </p>

            <p className="text-xs text-white/50">
              Active Alerts
            </p>
          </div>
        </div>

        {redMode && (
          <p className="mt-4 text-xs text-red-200/70">
            Emergency Red Mode will clear when the
            relevant emergency sessions are stopped
            or resolved and the page refreshes.
          </p>
        )}
      </div>
    </section>
  );
}
