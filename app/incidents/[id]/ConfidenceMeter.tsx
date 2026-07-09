type Props = {
  score: number;
  status: string;
};

export default function ConfidenceMeter({
  score,
  status,
}: Props) {
  return (
    <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#111] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">
          Confidence Score
        </h2>

        <span
          className={`rounded-full px-4 py-2 text-xs font-black ${
            status === "CRITICAL"
              ? "bg-red-500 text-white"
              : status === "VERIFIED"
              ? "bg-emerald-500 text-black"
              : status === "FALSE"
              ? "bg-gray-600 text-white"
              : "bg-yellow-500 text-black"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-6 h-5 overflow-hidden rounded-full bg-black/40">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            status === "CRITICAL"
              ? "bg-red-500"
              : status === "VERIFIED"
              ? "bg-emerald-500"
              : status === "FALSE"
              ? "bg-gray-500"
              : "bg-yellow-400"
          }`}
          style={{
            width: `${score}%`,
          }}
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-white/50">
          Reliability
        </p>

        <p className="text-4xl font-black text-emerald-400">
          {score}%
        </p>
      </div>

      <p className="mt-3 text-sm text-white/60">
        This score increases as more community members verify the report and additional evidence is added.
      </p>
    </section>
  );
}