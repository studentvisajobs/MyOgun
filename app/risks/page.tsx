import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function RisksPage() {
  const incidents = await prisma.incident.findMany();

  const totalIncidents = incidents.length;

  const verifiedIncidents = incidents.filter(
    (i) => i.status === "VERIFIED"
  ).length;

  const averageConfidence =
    totalIncidents > 0
      ? Math.round(
          incidents.reduce(
            (sum, i) => sum + i.confidenceScore,
            0
          ) / totalIncidents
        )
      : 0;

  let riskLevel = "LOW";
  let riskColor = "text-green-400";

  if (averageConfidence >= 70) {
    riskLevel = "HIGH";
    riskColor = "text-red-400";
  } else if (averageConfidence >= 40) {
    riskLevel = "MEDIUM";
    riskColor = "text-yellow-400";
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="font-bold text-emerald-400"
        >
          ← Home
        </Link>

        <h1 className="mt-8 text-5xl font-black">
          Community Risk Dashboard
        </h1>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <Card
            title="Total Incidents"
            value={String(totalIncidents)}
          />

          <Card
            title="Verified Incidents"
            value={String(verifiedIncidents)}
          />

          <Card
            title="Average Confidence"
            value={`${averageConfidence}%`}
          />

          <Card
            title="Risk Level"
            value={riskLevel}
            color={riskColor}
          />
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 p-8">
          <h2 className="text-3xl font-black">
            Community Assessment
          </h2>

          <p className="mt-4 text-lg text-white/70">
            Current community risk level is
            {" "}
            <span className={riskColor}>
              {riskLevel}
            </span>
            {" "}
            based on incident confidence,
            verification status, witness reports,
            and evidence submitted.
          </p>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <p className="text-sm text-white/50">
        {title}
      </p>

      <h2 className={`mt-3 text-4xl font-black ${color}`}>
        {value}
      </h2>
    </div>
  );
}