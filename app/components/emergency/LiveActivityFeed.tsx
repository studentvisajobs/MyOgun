import Card from "../ui/Card";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: Date;
  type: "incident" | "evidence" | "witness" | "critical";
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveActivityFeed({ items }: { items: ActivityItem[] }) {
  const icon = {
    incident: "📍",
    evidence: "📷",
    witness: "👥",
    critical: "🚨",
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Live Activity</h2>

        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
          LIVE
        </span>
      </div>

      <div className="mt-6 space-y-5">
        {items.length === 0 ? (
          <p className="text-sm text-white/50">No activity yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/40 text-xl">
                {icon[item.type]}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{item.title}</p>
                  <span className="shrink-0 text-xs text-white/40">
                    {formatTime(item.time)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-white/50">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}