import { prisma } from "@/lib/prisma";
import ThreatMapClient from "./ThreatMapClient";

export default async function ThreatMapPage() {
  const incidents = await prisma.incident.findMany({
    include: {
      evidence: true,
      confirmations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return <ThreatMapClient incidents={incidents} />;
}