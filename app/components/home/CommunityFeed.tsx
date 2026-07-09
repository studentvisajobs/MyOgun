import Link from "next/link";
import type { Incident } from "@/app/generated/prisma";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommunityFeed({
  incidents,
}: {
  incidents: Incident[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">🌍 Community Intelligence</h2>
          <p className="mt-1 text-sm text-white/40">Live reports near you</p>
        </div>

        <Link href="/incidents" className="text-sm font-bold text-emerald-400">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#111] p-5 text-white/60">
            No community alerts yet.
          </div>
        ) : (
          incidents.map((incident) => {
            const isCritical =
              incident.status === "CRITICAL" ||
              incident.confidenceScore >= 80;

            return (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className={`block rounded-[2rem] border p-5 transition hover:scale-[1.01] ${
                  isCritical
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-white/10 bg-[#111]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      isCritical ? "bg-red-500/20" : "bg-emerald-500/10"
                    }`}
                  >
                    {isCritical ? "🚨" : "⚠️"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`text-xs font-black ${
                          isCritical ? "text-red-300" : "text-emerald-400"
                        }`}
                      >
                        {incident.type.replaceAll("_", " ")}
                      </p>

                      <span className="shrink-0 text-xs text-white/40">
                        {timeAgo(incident.createdAt)}
                      </span>
                    </div>

                    <h3 className="mt-2 line-clamp-2 text-lg font-black">
                      {incident.title}
                    </h3>

                    <p className="mt-1 text-sm text-white/50">
                      📍{" "}
                      {incident.area ||
                        incident.localGovernment ||
                        "Location pending"}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isCritical
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {incident.status}
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
                        Score {incident.confidenceScore}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}