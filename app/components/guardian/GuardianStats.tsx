"use client";

type GuardianStatsProps = {
  responderCount: number;
  evidenceCount: number;
  acknowledgementCount: number;
};

type StatCardProps = {
  title: string;
  value: number;
  icon: string;
};

function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <article className="rounded-xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {title}
        </p>

        <span className="text-2xl">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-4xl font-black text-white">
        {value}
      </p>
    </article>
  );
}

export default function GuardianStats({
  responderCount,
  evidenceCount,
  acknowledgementCount,
}: GuardianStatsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Responders"
        value={responderCount}
        icon="👥"
      />

      <StatCard
        title="Evidence"
        value={evidenceCount}
        icon="📷"
      />

      <StatCard
        title="Acknowledgements"
        value={acknowledgementCount}
        icon="✅"
      />
    </section>
  );
}