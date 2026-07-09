type GuardianStatusProps = {
  active: boolean;
  seconds: number;
};

export default function GuardianStatus({ active, seconds }: GuardianStatusProps) {
  function formatTime(sec: number) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div
      className={`rounded-[2rem] border p-6 text-center ${
        active
          ? "border-red-500/30 bg-red-500/10"
          : "border-emerald-500/30 bg-emerald-500/10"
      }`}
    >
      <div className="text-6xl">🛡️</div>

      <h1 className="mt-4 text-4xl font-black">
        {active ? "Guardian Active" : "Guardian Ready"}
      </h1>

      <p className="mt-2 text-white/60">
        {active
          ? "MyOgun is protecting you now."
          : "Everything looks safe."}
      </p>

      <div className="mt-6 rounded-full bg-black/30 px-5 py-3 text-xl font-black">
        {active ? formatTime(seconds) : "SAFE"}
      </div>
    </div>
  );
}