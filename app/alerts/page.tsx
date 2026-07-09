import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AlertsPage() {
  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-emerald-400">
          ← Back Home
        </Link>

        <h1 className="mt-8 text-4xl font-black">Nearby Alerts</h1>

        <div className="mt-6 space-y-4">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-3xl border border-white/10 bg-[#121212] p-5"
            >
              <p className="text-xs font-black text-emerald-400">
                {incident.type.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 text-xl font-black">{incident.title}</h2>
              <p className="mt-1 text-sm text-white/50">
                {incident.area || incident.localGovernment || "Unknown"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}