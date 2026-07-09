import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { calculatePriority } from "@/lib/calculatePriority";
import IncidentStatusButtons from "./IncidentStatusButtons";

export default async function PoliceDashboardPage() {
  const incidents = await prisma.incident.findMany({
    include: {
      evidence: true,
      confirmations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const critical = incidents.filter((i) => i.status === "CRITICAL");
  const verified = incidents.filter((i) => i.status === "VERIFIED");

  const priorityIncidents = incidents
    .map((incident) => ({
      ...incident,
      priority: calculatePriority(
        incident.confidenceScore,
        incident.confirmations.length,
        incident.evidence.length,
        incident.status === "CRITICAL"
      ),
    }))
    .sort((a, b) => b.priority - a.priority);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="font-bold text-emerald-400">
          ← Home
        </Link>

        <h1 className="mt-8 text-5xl font-black">
          Police / Response Dashboard
        </h1>

        <p className="mt-3 text-white/60">
          Operational view of critical alerts, verified reports, evidence and
          witness activity.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <Card title="Total Reports" value={String(incidents.length)} />
          <Card title="Critical Alerts" value={String(critical.length)} />
          <Card title="Verified Reports" value={String(verified.length)} />
          <Card
            title="Evidence Files"
            value={String(
              incidents.reduce((sum, i) => sum + i.evidence.length, 0)
            )}
          />
        </div>

        <div className="mt-6">
          <Link
            href="/police/map"
            className="inline-block rounded-full bg-emerald-500 px-5 py-3 font-bold text-black"
          >
            Open Live Operations Map
          </Link>
        </div>

        <section className="mt-10 rounded-3xl border border-orange-500/20 bg-orange-500/10 p-6">
          <h2 className="text-3xl font-black">Priority Response Queue</h2>

          <p className="mt-2 text-white/60">
            Highest-risk incidents requiring immediate attention.
          </p>

          <div className="mt-6 space-y-4">
            {priorityIncidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className="rounded-2xl border border-orange-500/20 bg-black/40 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">{incident.title}</h3>

                  <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-black">
                    PRIORITY {incident.priority}
                  </span>
                </div>

                <p className="mt-2 text-white/60">
                  {incident.type.replaceAll("_", " ")}
                </p>

                <p className="mt-2 text-sm text-white/50">
                  👥 {incident.confirmations.length} witnesses • 📷{" "}
                  {incident.evidence.length} evidence files
                </p>

                <p className="mt-1 text-sm text-white/50">
                  📍 {incident.area || "Unknown Area"}
                  {incident.localGovernment
                    ? ` • ${incident.localGovernment}`
                    : ""}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-emerald-500 px-4 py-2 font-bold text-black"
                  >
                    📍 Open Location
                  </a>

                  <Link
                    href={`/incidents/${incident.id}`}
                    className="rounded-full border border-white/20 px-4 py-2 font-bold text-white"
                  >
                    View Report
                  </Link>
                </div>

                <div className="mt-4">
                  <IncidentStatusButtons incidentId={incident.id} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
          <h2 className="text-3xl font-black">Critical Incidents</h2>

          <div className="mt-6 space-y-4">
            {critical.length === 0 ? (
              <p className="text-white/50">No critical incidents.</p>
            ) : (
              critical.map((incident) => (
                <div
                  key={incident.id}
                  className="rounded-2xl border border-red-500/30 bg-black/40 p-5"
                >
                  <h3 className="text-xl font-bold text-red-300">
                    {incident.title}
                  </h3>

                  <p className="mt-2 text-white/60">
                    {incident.type.replaceAll("_", " ")} •{" "}
                    {incident.confidenceScore}% confidence
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    📍 {incident.area || "Unknown Area"}
                    {incident.localGovernment
                      ? ` • ${incident.localGovernment}`
                      : ""}
                  </p>

                  <p className="mt-1 text-sm text-white/50">
                    GPS: {incident.latitude}, {incident.longitude}
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    👥 {incident.confirmations.length} witness votes • 📷{" "}
                    {incident.evidence.length} evidence files
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-emerald-500 px-4 py-2 font-bold text-black"
                    >
                      📍 Open Location
                    </a>

                    <Link
                      href={`/incidents/${incident.id}`}
                      className="rounded-full border border-white/20 px-4 py-2 font-bold text-white"
                    >
                      View Full Report
                    </Link>
                  </div>

                  <div className="mt-4">
                    <IncidentStatusButtons incidentId={incident.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-3xl font-black">All Recent Reports</h2>

          <div className="mt-6 space-y-4">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-bold">{incident.title}</h3>
                  <span className="text-sm text-white/50">
                    {incident.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/60">
                  {incident.confidenceScore}% confidence •{" "}
                  {incident.type.replaceAll("_", " ")}
                </p>

                <p className="mt-1 text-sm text-white/50">
                  📍 {incident.area || "Unknown Area"}
                  {incident.localGovernment
                    ? ` • ${incident.localGovernment}`
                    : ""}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-emerald-500 px-4 py-2 font-bold text-black"
                  >
                    📍 Open Location
                  </a>

                  <Link
                    href={`/incidents/${incident.id}`}
                    className="rounded-full border border-white/20 px-4 py-2 font-bold text-white"
                  >
                    View Report
                  </Link>
                </div>

                <div className="mt-4">
                  <IncidentStatusButtons incidentId={incident.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-sm text-white/50">{title}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}