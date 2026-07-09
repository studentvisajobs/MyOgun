type Props = {
  title: string;
  summary: string;
  recommendation: string;
  score: number;
};

export default function MyOgunIntelligenceCard({
  title,
  summary,
  recommendation,
  score,
}: Props) {
  return (
    <section className="rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-[#07151a] to-black p-6">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
        MyOgun Intelligence
      </p>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>

          <p className="mt-3 text-sm leading-7 text-white/70">
            {summary}
          </p>
        </div>

        <div className="rounded-full border border-cyan-400/30 bg-black/40 px-4 py-3 text-center">
          <div className="text-2xl font-black text-cyan-300">{score}</div>
          <div className="text-[10px] text-white/50">Score</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-black/35 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
          Recommendation
        </p>

        <p className="mt-2 text-sm leading-6 text-white/75">
          {recommendation}
        </p>
      </div>
    </section>
  );
}