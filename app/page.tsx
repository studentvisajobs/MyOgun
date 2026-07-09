import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "./components/layout/AppShell";
import NearbyDangerAlert from "./components/home/NearbyDangerAlert";
import QuickActions from "./components/home/QuickActions";
import CommunityFeed from "./components/home/CommunityFeed";
import MyRecentReportStatus from "./components/home/MyRecentReportStatus";
import SafetyStatusHero from "./components/home/SafetyStatusHero";
import MyOgunIntelligenceCard from "./components/intelligence/MyOgunIntelligenceCard";
import { generateMyOgunIntelligence } from "@/lib/intelligence/MyOgunIntelligence";

export default async function Home() {
  const user = await getCurrentUser();

  const guardians = user
    ? await prisma.guardianContact.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      })
    : [];

  const latestIncidents = await prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const activeAlerts = await prisma.incident.count({
    where: {
      status: {
        in: ["CRITICAL", "VERIFIED", "RESPONDING"],
      },
    },
  });

  const myLatestIncident = user
    ? await prisma.incident.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      })
    : null;

  const myLocation = user
    ? await prisma.sharedLocation.findUnique({
        where: { userId: user.id },
      })
    : null;

const emergencyContacts = user
  ? await prisma.emergencyContact.count({
      where: {
        userId: user.id,
      },
    })
  : 0;

  const intelligence = generateMyOgunIntelligence({
    guardianCount: guardians.length,
    nearbyAlerts: activeAlerts,
    sharingLocation: !!myLocation,
    activeJourney: false,
    emergencyContacts,
  });

  const displayName = user?.name?.split(" ")[0] || "there";

  return (
    <AppShell>
      <SafetyStatusHero
        userName={displayName}
        activeAlerts={activeAlerts}
        guardianCount={guardians.length}
      />

      <MyOgunIntelligenceCard
        title={intelligence.title}
        summary={intelligence.summary}
        recommendation={intelligence.recommendation}
        score={intelligence.score}
      />

      <NearbyDangerAlert />

      <QuickActions />

      <MyRecentReportStatus incident={myLatestIncident} />

      <CommunityFeed incidents={latestIncidents} />
    </AppShell>
  );
}