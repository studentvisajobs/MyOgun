type TimelineEvent = {
  id: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
};

type TimelinePanelProps = {
  timeline: TimelineEvent[];
  refreshing?: boolean;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString();
}

export default function TimelinePanel({
  timeline,
  refreshing = false,
}: TimelinePanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            Operations Log
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Session Timeline
          </h2>
        </div>

        <span className="text-xs text-white/40">
          {refreshing
            ? "Refreshing..."
            : `${timeline.length} Events`}
        </span>
      </div>

      <div className="mt-6">
        {timeline.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
            <div className="text-4xl">📝</div>

            <p className="mt-4 text-sm font-medium text-white/50">
              No timeline events yet.
            </p>

            <p className="mt-2 text-xs text-white/30">
              Activity will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {timeline.map((event, index) => (
              <div
                key={event.id}
                className="relative pl-8"
              >
                {index !== timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 h-full w-px bg-red-500/30" />
                )}

                <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-red-500 bg-red-600 text-xs">
                  ✓
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="font-medium text-white">
                    {event.message}
                  </p>

                  <p className="mt-2 text-xs text-white/40">
                    {formatDateTime(event.createdAt)}
                  </p>

                  {(event.latitude !== null &&
                    event.latitude !== undefined &&
                    event.longitude !== null &&
                    event.longitude !== undefined) && (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/35">
                      <span>
                        📍 Lat: {event.latitude}
                      </span>

                      <span>
                        📍 Lng: {event.longitude}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}