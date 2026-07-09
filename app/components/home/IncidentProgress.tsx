type Props = {
  status: string;
};

export default function IncidentProgress({ status }: Props) {
  const current =
    status === "PENDING"
      ? 1
      : status === "VERIFIED"
      ? 2
      : status === "CRITICAL"
      ? 2
      : status === "RESPONDING"
      ? 3
      : status === "RESOLVED"
      ? 4
      : 1;

  const steps = [
    "Report Submitted",
    "Community Verified",
    "Emergency Response",
    "Resolved",
  ];

  return (
    <div className="mt-6">
      <p className="text-sm font-black tracking-[0.25em] text-emerald-400">
        REPORT PROGRESS
      </p>

      <div className="mt-5 space-y-4">
        {steps.map((step, index) => {
          const completed = index + 1 <= current;

          return (
            <div
              key={step}
              className="flex items-center gap-4"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${
                  completed
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {completed ? "✓" : index + 1}
              </div>

              <div>
                <p
                  className={`font-bold ${
                    completed ? "text-white" : "text-white/40"
                  }`}
                >
                  {step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}