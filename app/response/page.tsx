import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SummaryCard from "../components/emergency/SummaryCard";
import IncidentCard from "../components/emergency/IncidentCard";
import LiveActivityFeed from "../components/emergency/LiveActivityFeed";

export default async function ResponsePage() {
  const incidents = await prisma.incident.findMany({
    include: {
      evidence: true,
      confirmations: true,
    },
    orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
  });

  const activityItems = incidents
    .flatMap((incident) => [
      {
        id: `${incident.id}-incident`,
        title: "Incident Reported",
        description: `${incident.title} • ${
          incident.area || incident.localGovernment || "Location pending"
        }`,
        time: incident.createdAt,
        type:
          incident.status === "CRITICAL"
            ? ("critical" as const)
            : ("incident" as const),
      },
      ...incident.evidence.map((item) => ({
        id: item.id,
        title: `${item.type} Evidence Uploaded`,
        description: incident.title,
        time: item.createdAt,
        type: "evidence" as const,
      })),
      ...incident.confirmations.map((item) => ({
        id: item.id,
        title:
          item.vote === "CONFIRM"
            ? "Witness Confirmed"
            : "Report Disputed",
        description: incident.title,
        time: item.createdAt,
        type: "witness" as const,
      })),
    ])
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10);

  const critical = incidents.filter((i) => i.status === "CRITICAL");
  const active = incidents.filter((i) =>
    ["PENDING", "VERIFIED", "RESPONDING"].includes(i.status)
  );
  const resolved = incidents.filter((i) => i.status === "RESOLVED");

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 pb-32 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black tracking-[0.3em] text-emerald-400">
              MYOGUN OS
            </p>
            <h1 className="mt-3 text-4xl font-black md:text-5xl">
              🚨 Response Centre
            </h1>
            <p className="mt-3 text-white/60">
              Live incident intelligence, evidence review, and response priority
              queue.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-black hover:border-emerald-500"
          >
            Home
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard title="Critical" value={critical.length} colour="red" />
          <SummaryCard title="Active" value={active.length} colour="yellow" />
          <SummaryCard
            title="Resolved"
            value={resolved.length}
            colour="emerald"
          />
          <SummaryCard
            title="Total Reports"
            value={incidents.length}
            colour="blue"
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black tracking-[0.25em] text-red-300">
                  PRIORITY QUEUE
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Highest Risk Incidents
                </h2>
              </div>

              <span className="rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white">
                LIVE
              </span>
            </div>

            <div className="mt-6 grid gap-5">
              {incidents.length === 0 ? (
                <div className="rounded-[2rem] border border-white/10 bg-black/30 p-8 text-center text-white/50">
                  No incidents reported yet.
                </div>
              ) : (
                incidents.slice(0, 8).map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    id={incident.id}
                    title={incident.title}
                    type={incident.type}
                    confidence={incident.confidenceScore}
                    status={incident.status}
                    witnesses={
                      incident.confirmations.filter(
                        (v) => v.vote === "CONFIRM"
                      ).length
                    }
                    evidence={incident.evidence.length}
                    area={incident.area || incident.localGovernment}
                  />
                ))
              )}
            </div>
          </section>

          <LiveActivityFeed items={activityItems} />
        </div>
      </div>
    </main>
  );
}