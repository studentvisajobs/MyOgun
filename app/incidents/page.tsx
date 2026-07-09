import { prisma } from "@/lib/prisma";


export default async function IncidentsPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="font-bold text-emerald-400">
          ← Home
        </a>

        <div className="mt-8 flex items-center justify-between">
          <h1 className="text-4xl font-black">
            Community Intelligence Feed
          </h1>

          <a
            href="/report-incident"
            className="rounded-full bg-red-500 px-5 py-3 font-bold"
          >
            Report Incident
          </a>
        </div>

        <div className="mt-8 space-y-5">
          {incidents.length === 0 ? (
            <div className="rounded-3xl border border-white/10 p-8">
              No incidents reported yet.
            </div>
          ) : (
            incidents.map((incident) => (
              <a
                href={`/incidents/${incident.id}`}
                key={incident.id}
                className="block rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-red-500/40"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-400">
                    {incident.type.replaceAll("_", " ")}
                  </span>

                  <span className="text-sm text-white/50">
                    Confidence: {incident.confidenceScore}%
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-bold">
                  {incident.title}
                </h2>

                {incident.description && (
                  <p className="mt-2 text-white/60">
                    {incident.description}
                  </p>
                )}

                <div className="mt-4 flex gap-4 text-sm text-white/50">
                  <span>Status: {incident.status}</span>
                </div>

                <div className="mt-5 inline-block rounded-full border border-emerald-400 px-5 py-2 text-sm font-bold text-emerald-400">
                  View Incident Details
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </main>
  );
}