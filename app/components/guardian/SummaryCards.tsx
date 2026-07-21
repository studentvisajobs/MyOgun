type SummaryCardsProps = {
  responderCount?: number;
  evidenceCount?: number;
  acknowledgementCount?: number;
  hasLocation?: boolean;
};

type SummaryCardProps = {
  label: string;
  value: string | number;
  description: string;
  icon: string;
};

function SummaryCard({
  label,
  value,
  description,
  icon,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            {label}
          </p>

          <p className="mt-3 text-4xl font-black tracking-tight text-white">
            {value}
          </p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xl"
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/50">
        {description}
      </p>
    </article>
  );
}

export default function SummaryCards({
  responderCount = 0,
  evidenceCount = 0,
  acknowledgementCount = 0,
  hasLocation = false,
}: SummaryCardsProps) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Guardian session summary"
    >
      <SummaryCard
        label="Responders"
        value={responderCount}
        description="Guardians assigned to this emergency session."
        icon="👥"
      />

      <SummaryCard
        label="Evidence"
        value={evidenceCount}
        description="Images, videos, audio, or documents captured."
        icon="📁"
      />

      <SummaryCard
        label="Acknowledged"
        value={acknowledgementCount}
        description="Guardian acknowledgements recorded during the session."
        icon="✅"
      />

      <SummaryCard
        label="Live location"
        value={hasLocation ? "Available" : "Unavailable"}
        description={
          hasLocation
            ? "The latest device location is available."
            : "No reliable location has been received yet."
        }
        icon={hasLocation ? "📍" : "⚠️"}
      />
    </section>
  );
}