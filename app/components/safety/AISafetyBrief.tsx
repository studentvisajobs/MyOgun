type Props = {
  title: string;
  summary: string;
  recommendation: string;
};

export default function AISafetyBrief({
  title,
  summary,
  recommendation,
}: Props) {
  return (
    <section className="mt-6 rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-[#101418] p-6">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
        AI SAFETY BRIEF
      </p>

      <h2 className="mt-4 text-2xl font-black">
        {title}
      </h2>

      <p className="mt-3 text-white/70 leading-7">
        {summary}
      </p>

      <div className="mt-5 rounded-2xl bg-black/30 p-4">
        <p className="text-xs uppercase tracking-widest text-cyan-300">
          Recommendation
        </p>

        <p className="mt-2 text-sm text-white/80">
          {recommendation}
        </p>
      </div>
    </section>
  );
}