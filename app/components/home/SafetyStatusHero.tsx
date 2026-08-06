type Props = {
  userName: string;
  activeAlerts: number;
  guardianCount: number;
};

export default function SafetyStatusHero({
  userName,
  activeAlerts,
  guardianCount,
}: Props) {
  const hasAlerts = activeAlerts > 0;

  return (
    <section className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#061f16] via-[#07110d] to-black p-6 shadow-2xl">
      <p className="text-sm font-black tracking-[0.3em] text-emerald-400">
        MYOGUN
      </p>

      <h1 className="mt-4 text-4xl font-black">
        Good day, {userName}
      </h1>

      <div className="mt-6 rounded-[2rem] border border-emerald-500/20 bg-black/40 p-6 text-center">
        <div
          className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border ${
            hasAlerts
              ? "border-red-500 bg-red-500/10"
              : "border-emerald-500 bg-emerald-500/10"
          }`}
        >
          <span className="text-6xl">
            {hasAlerts ? "🚨" : "🛡️"}
          </span>
        </div>

        <h2
          className={`mt-5 text-3xl font-black ${
            hasAlerts
              ? "text-red-400"
              : "text-emerald-400"
          }`}
        >
          {hasAlerts ? "IMMEDIATE DANGER" : "SAFETY MONITORING ACTIVE"}
        </h2>

        {hasAlerts && (
          <p className="mt-2 text-white/70">
            {activeAlerts} active alert
            {activeAlerts > 1 ? "s" : ""} nearby.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/40 p-4">
            <p className="text-2xl font-black text-emerald-400">
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
      </div>
    </section>
  );
}