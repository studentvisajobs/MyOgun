import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PoliceMapWrapper from "./PoliceMapWrapper";

export default async function PoliceMapPage() {
  const incidents = await prisma.incident.findMany({
    include: {
      evidence: true,
      confirmations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/police" className="font-bold text-emerald-400">
          ← Back Dashboard
        </Link>

        <h1 className="mt-6 text-5xl font-black">Live Operations Map</h1>

        <p className="mt-3 text-white/60">
          Real-time operational view of incidents across Ogun State.
        </p>

        <div className="mt-8">
          <PoliceMapWrapper incidents={incidents} />
        </div>
      </div>
    </main>
  );
}