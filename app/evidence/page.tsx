import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function EvidencePage() {
  const evidence = await prisma.emergencyEvidence.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-bold text-emerald-400">
          ← Home
        </Link>

        <h1 className="mt-8 text-4xl font-black">Evidence Vault</h1>
        <p className="mt-3 text-white/60">
          Emergency evidence created by Guardian Mode, Silent SOS, and future Safe Journey sessions.
        </p>

        <div className="mt-6 space-y-4">
          {evidence.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#111] p-6 text-white/60">
              No emergency evidence yet.
            </div>
          ) : (
            evidence.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] border border-white/10 bg-[#111] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-emerald-400">
                      {item.type}
                    </p>
                    <h2 className="mt-2 text-xl font-black">
                      {item.mode || "Emergency Evidence"}
                    </h2>
                    <p className="mt-1 text-sm text-white/50">
                      {item.createdAt.toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">
                    {item.status}
                  </span>
                </div>

                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    className="mt-4 block rounded-full bg-emerald-500 py-3 text-center font-black text-black"
                  >
                    View Evidence
                  </a>
                )}

                {item.latitude && item.longitude && (
                  <p className="mt-4 text-sm text-white/60">
                    📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}