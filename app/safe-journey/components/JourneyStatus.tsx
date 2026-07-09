type Props = {
  destination: string;
  active: boolean;
  eta?: string;
};

export default function JourneyStatus({
  destination,
  active,
  eta,
}: Props) {
  return (
    <section className="rounded-[2rem] border border-emerald-500/20 bg-[#111] p-5">
      <p className="text-sm font-black tracking-[0.3em] text-emerald-400">
        SAFE JOURNEY
      </p>

      <h1 className="mt-3 text-3xl font-black">
        {active ? "Journey Active" : "Ready to Travel"}
      </h1>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between">
          <span className="text-white/50">Destination</span>
          <span className="font-bold">
            {destination || "Not selected"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/50">Status</span>

          <span
            className={`font-black ${
              active ? "text-emerald-400" : "text-white/60"
            }`}
          >
            {active ? "ACTIVE" : "READY"}
          </span>
        </div>

        {eta && (
          <div className="flex justify-between">
            <span className="text-white/50">ETA</span>
            <span>{eta}</span>
          </div>
        )}
      </div>
    </section>
  );
}