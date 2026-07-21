import StatusBadge from "./StatusBadge";

type DashboardHeaderProps = {
  userName?: string | null;
  userPhone?: string | null;
  status?: string | null;
  startedAt?: string | Date | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

function formatDateTime(
  value?: string | Date | null
) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString();
}

export default function DashboardHeader({
  userName,
  userPhone,
  status,
  startedAt,
  batteryLevel,
  networkStatus,
}: DashboardHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/60 via-black to-black shadow-2xl shadow-red-950/20">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-2xl"
              aria-hidden="true"
            >
              🚨
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">
                Emergency coordination
              </p>

              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Guardian Mode
              </h1>
            </div>
          </div>

          <div>
            <p className="text-lg font-bold text-white">
              {userName?.trim() ||
                "Unknown user"}
            </p>

            {userPhone ? (
              <a
                href={`tel:${userPhone}`}
                className="mt-1 inline-block text-sm text-white/60 transition hover:text-white"
              >
                {userPhone}
              </a>
            ) : (
              <p className="mt-1 text-sm text-white/40">
                No phone number available
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={status} />

            <p className="text-sm text-white/50">
              Started {formatDateTime(startedAt)}
            </p>
          </div>
        </div>

        <div className="grid min-w-full grid-cols-2 gap-3 md:min-w-72">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Battery
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {batteryLevel === null ||
              batteryLevel === undefined
                ? "--"
                : `${batteryLevel}%`}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Network
            </p>

            <p className="mt-2 break-words text-2xl font-black text-white">
              {networkStatus?.trim() || "--"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-red-500/20 bg-red-500/[0.06] px-6 py-3">
        <p className="text-sm text-red-100/70">
          This dashboard contains live emergency
          information. Keep it open while the session
          remains active.
        </p>
      </div>
    </section>
  );
}