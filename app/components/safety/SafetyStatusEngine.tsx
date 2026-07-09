import SafetyScoreRing from "./SafetyScoreRing";

type SafetyStatusEngineProps = {
  guardianCount?: number;
  activeAlerts?: number;
  activeJourney?: boolean;
  locationSharing?: boolean;
};

export default function SafetyStatusEngine({
  guardianCount = 0,
  activeAlerts = 0,
  activeJourney = false,
  locationSharing = false,
}: SafetyStatusEngineProps) {
  const safetyScore =
    activeAlerts > 0 ? 72 : guardianCount > 0 || locationSharing ? 92 : 84;

  const safetyState =
    activeAlerts > 0 ? "Attention Needed" : "You are Protected";

  const safetyColor =
    activeAlerts > 0 ? "text-yellow-300" : "text-emerald-400";

  return (
    <section className="rounded-[2.2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-[#071b14] to-black p-6 shadow-2xl shadow-emerald-500/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400">
            Live Safety Status
          </p>

          <h2 className={`mt-4 text-3xl font-black leading-tight ${safetyColor}`}>
            {safetyState}
          </h2>

          <p className="mt-2 text-sm text-white/60">
            MyOgun is monitoring your safety, guardians, journey and nearby
            danger signals.
          </p>
        </div>

        <SafetyScoreRing score={safetyScore} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatusPill
          label="Guardians"
          value={`${guardianCount} Ready`}
          active={guardianCount > 0}
        />

        <StatusPill
          label="Nearby Alerts"
          value={activeAlerts > 0 ? `${activeAlerts} Active` : "Clear"}
          active={activeAlerts === 0}
          warning={activeAlerts > 0}
        />

        <StatusPill
          label="Journey"
          value={activeJourney ? "Active" : "Inactive"}
          active={activeJourney}
        />

        <StatusPill
          label="Location"
          value={locationSharing ? "Sharing" : "Ready"}
          active={locationSharing}
        />
      </div>
    </section>
  );
}

function StatusPill({
  label,
  value,
  active,
  warning = false,
}: {
  label: string;
  value: string;
  active: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            warning ? "bg-yellow-300" : active ? "bg-emerald-400" : "bg-white/30"
          }`}
        />

        <p
          className={`text-sm font-black ${
            warning ? "text-yellow-300" : active ? "text-emerald-300" : "text-white/65"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}