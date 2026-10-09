
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "./components/layout/AppShell";
import QuickActions from "./components/home/QuickActions";
import CommunityFeed from "./components/home/CommunityFeed";
import MyRecentReportStatus from "./components/home/MyRecentReportStatus";
import SafetyStatusHero from "./components/home/SafetyStatusHero";
import EmergencyAutoRefresh from "./components/home/EmergencyAutoRefresh";
import HomeSafetyIntelligence from "./components/home/HomeSafetyIntelligence";

export default async function Home() {
  const user = await getCurrentUser();

  const guardianCount = user
    ? await prisma.guardianContact.count({
        where: { userId: user.id },
      })
    : 0;

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
        where: { userId: user.id },
      })
    : 0;

  // Emergency belonging to the logged-in user.
  const activeEmergency = user
    ? await prisma.guardianSession.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        orderBy: { startedAt: "desc" },
        select: { id: true },
      })
    : null;

  // Find users who have explicitly accepted this
  // logged-in user as their guardian.
// An accepted Guardian Invitation creates mutual protection.
// Both sender and receiver can monitor each other's emergencies.
const acceptedInvitations = user
  ? await prisma.guardianInvitation.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    })
  : [];

const protectedUserIds = [
  ...new Set(
    acceptedInvitations
      .map((invitation) =>
        invitation.senderId === user?.id
          ? invitation.receiverId
          : invitation.senderId
      )
      .filter((id): id is string =>
        Boolean(id) && id !== user?.id
      )
  ),
];

  // Detect active emergency sessions for
  // authorised Guardian Circle connections.

  // Check both emergency systems for accepted Guardian
  // Network connections.
  const guardianEmergency =
    protectedUserIds.length > 0
      ? await prisma.emergencySession.findFirst({
          where: {
            userId: {
              in: protectedUserIds,
            },
            status: {
              in: ["ACTIVE", "MONITORING", "RESPONDING"],
            },
          },
          orderBy: {
            startedAt: "desc",
          },
          select: {
            userId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;

  // Some emergency flows may use GuardianSession
  // without an EmergencySession.
  const guardianSessionEmergency =
    !guardianEmergency && protectedUserIds.length > 0
      ? await prisma.guardianSession.findFirst({
          where: {
            userId: {
              in: protectedUserIds,
            },
            status: "ACTIVE",
          },
          orderBy: {
            startedAt: "desc",
          },
          select: {
            userId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;

  const connectedEmergency =
    guardianEmergency ?? guardianSessionEmergency;


  const displayName =
    user?.name?.split(" ")[0] || "there";

const guardianEmergencyName =
  connectedEmergency?.user?.name || "Your guardian contact";

  return (
    <AppShell>
      <EmergencyAutoRefresh />
      <SafetyStatusHero
        userName={displayName}
        activeAlerts={activeAlerts}
        guardianCount={guardianCount}
        emergencyActive={Boolean(activeEmergency)}
        guardianEmergencyName={
          connectedEmergency
            ? guardianEmergencyName
            : null
        }
      />

      <HomeSafetyIntelligence
        guardianCount={guardianCount}
        sharingLocation={Boolean(myLocation)}
        emergencyContacts={emergencyContacts}
      />

      <QuickActions />

      <MyRecentReportStatus
        incident={myLatestIncident}
      />

      <CommunityFeed incidents={latestIncidents} />
    </AppShell>
  );
}

