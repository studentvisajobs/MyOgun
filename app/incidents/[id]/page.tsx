import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import StatCard from "../../components/ui/StatCard";

import EvidenceGallery from "./EvidenceGallery";
import CommunityVerificationPanel from "./CommunityVerificationPanel";
import ConfidenceMeter from "./ConfidenceMeter";
import IncidentTimelinePanel from "./IncidentTimelinePanel";

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      evidence: true,
      confirmations: true,
      updates: true,
      user: true,
    },
  });

  if (!incident) {
    notFound();
  }

  const confirmCount = incident.confirmations.filter(
    (item) => item.vote === "CONFIRM"
  ).length;

  const falseReportCount = incident.confirmations.filter(
    (item) => item.vote === "FALSE_REPORT"
  ).length;

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="font-bold text-emerald-400">
          ← Back
        </Link>

        <Card className="mt-8 p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black tracking-[0.3em] text-emerald-400">
                {incident.type.replaceAll("_", " ")}
              </p>

              <h1 className="mt-3 text-4xl font-black">{incident.title}</h1>
            </div>

            <StatusBadge label={incident.status} />
          </div>

          <p className="mt-5 text-white/60">
            {incident.description || "No description supplied."}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              title="Confidence"
              value={`${incident.confidenceScore}%`}
              subtitle="Reliability"
              colour="emerald"
            />

            <StatCard
              title="Evidence"
              value={incident.evidence.length}
              subtitle="Uploaded files"
              colour="blue"
            />

            <StatCard
              title="Witnesses"
              value={confirmCount}
              subtitle="Confirmed reports"
              colour="emerald"
            />

            <StatCard
              title="Disputed"
              value={falseReportCount}
              subtitle="False report votes"
              colour="red"
            />
          </div>
        </Card>

        <ConfidenceMeter
          score={incident.confidenceScore}
          status={incident.status}
        />

        <CommunityVerificationPanel
          incidentId={incident.id}
          initialConfidence={incident.confidenceScore}
          initialStatus={incident.status}
          initialConfirmCount={confirmCount}
          initialFalseReportCount={falseReportCount}
        />

        <IncidentTimelinePanel
          createdAt={incident.createdAt}
          evidence={incident.evidence}
          confirmations={incident.confirmations}
          updates={incident.updates}
        />

        <EvidenceGallery evidence={incident.evidence} />
      </div>
    </main>
  );
}