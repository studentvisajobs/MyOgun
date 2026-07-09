type Props = {
  score: number;
  label: string;
  status: "safe" | "caution" | "danger";
};

export default function SafetyScoreCard({ score, label, status }: Props) {
  const color =
    status === "safe"
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
      : status === "caution"
      ? "text-yellow-300 bg-yellow-500/10 border-yellow-500/20"
      : "text-red-300 bg-red-500/10 border-red-500/20";

  return (
    <section className={`mt-5 rounded-[2rem] border p-5 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black tracking-[0.25em]">
            SAFETY SCORE
          </p>

          <h2 className="mt-2 text-4xl font-black">{score}%</h2>

          <p className="mt-1 text-sm text-white/60">
            Guardian Intelligence
          </p>
        </div>

        <div className="text-5xl">
          {status === "safe" ? "🟢" : status === "caution" ? "🟡" : "🔴"}
        </div>
      </div>

      <div className="mt-4 rounded-full bg-black/30 px-4 py-3 text-center text-sm font-black">
        {label}
      </div>
    </section>
  );
}