"use client";

type GuardianHeaderProps = {
  name?: string | null;
  status: string;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

function statusColour(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-red-600";

    case "COMPLETED":
      return "bg-green-600";

    case "CANCELLED":
      return "bg-zinc-600";

    default:
      return "bg-yellow-600";
  }
}

export default function GuardianHeader({
  name,
  status,
  batteryLevel,
  networkStatus,
}: GuardianHeaderProps) {
  return (
    <section className="rounded-2xl border border-red-500/40 bg-zinc-950 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">
            🚨 Guardian Mode
          </h1>

          <p className="mt-2 text-white/60">
            {name ?? "Unknown User"}
          </p>
        </div>

        <div
          className={`inline-flex rounded-full px-4 py-2 text-sm font-bold text-white ${statusColour(
            status
          )}`}
        >
          {status}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">
            Battery
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {batteryLevel !== null &&
            batteryLevel !== undefined
              ? `${batteryLevel}%`
              : "--"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-white/50">
            Network
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {networkStatus ?? "--"}
          </p>
        </div>
      </div>
    </section>
  );
}