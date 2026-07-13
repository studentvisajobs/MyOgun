import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function normalizePhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/[^\d+]/g, "").trim();
}

function isRecentlyOnline(updatedAt: Date | null | undefined) {
  if (!updatedAt) {
    return false;
  }

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  return updatedAt.getTime() >= fiveMinutesAgo;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const guardianContacts = await prisma.guardianContact.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    if (guardianContacts.length === 0) {
      return NextResponse.json({
        guardians: [],
        total: 0,
        online: 0,
      });
    }

    const normalizedContactPhones = guardianContacts
      .map((contact) => normalizePhone(contact.phone))
      .filter(Boolean);

    const possibleGuardianUsers = await prisma.user.findMany({
      where: {
        phone: {
          in: normalizedContactPhones,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    const guardianUserByPhone = new Map(
      possibleGuardianUsers.map((user) => [
        normalizePhone(user.phone),
        user,
      ])
    );

    const guardianUserIds = possibleGuardianUsers.map((user) => user.id);

    const [
      sharedLocations,
      guardianSessions,
      safeJourneys,
      emergencySessions,
    ] = guardianUserIds.length
      ? await Promise.all([
          prisma.sharedLocation.findMany({
            where: {
              userId: {
                in: guardianUserIds,
              },
            },
          }),

          prisma.guardianSession.findMany({
            where: {
              userId: {
                in: guardianUserIds,
              },
              status: "ACTIVE",
            },
            orderBy: {
              updatedAt: "desc",
            },
          }),

          prisma.safeJourney.findMany({
            where: {
              userId: {
                in: guardianUserIds,
              },
              status: {
                in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          }),

          prisma.emergencySession.findMany({
            where: {
              userId: {
                in: guardianUserIds,
              },
              status: {
                in: ["ACTIVE", "MONITORING", "RESPONDING"],
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          }),
        ])
      : [[], [], [], []];

    const sharedLocationByUserId = new Map(
      sharedLocations.map((location) => [location.userId, location])
    );

    const activeGuardianSessionByUserId = new Map<
      string,
      (typeof guardianSessions)[number]
    >();

    for (const session of guardianSessions) {
      if (
        session.userId &&
        !activeGuardianSessionByUserId.has(session.userId)
      ) {
        activeGuardianSessionByUserId.set(session.userId, session);
      }
    }

    const activeJourneyByUserId = new Map<
      string,
      (typeof safeJourneys)[number]
    >();

    for (const journey of safeJourneys) {
      if (journey.userId && !activeJourneyByUserId.has(journey.userId)) {
        activeJourneyByUserId.set(journey.userId, journey);
      }
    }

    const activeEmergencyByUserId = new Map<
      string,
      (typeof emergencySessions)[number]
    >();

    for (const emergency of emergencySessions) {
      if (
        emergency.userId &&
        !activeEmergencyByUserId.has(emergency.userId)
      ) {
        activeEmergencyByUserId.set(emergency.userId, emergency);
      }
    }

    const guardians = guardianContacts.map((contact) => {
      const normalizedPhone = normalizePhone(contact.phone);
      const guardianUser = guardianUserByPhone.get(normalizedPhone);

      if (!guardianUser) {
        return {
          contactId: contact.id,
          userId: null,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          relation: contact.relation,
          isPrimary: contact.isPrimary,

          registered: false,
          online: false,

          latitude: null,
          longitude: null,
          accuracy: null,

          batteryLevel: null,
          networkStatus: "UNKNOWN",
          lastSeen: null,

          guardianMode: {
            active: false,
            status: null,
            startedAt: null,
          },

          safeJourney: {
            active: false,
            status: null,
            destination: null,
            estimatedArrival: null,
            startedAt: null,
          },

          emergency: {
            active: false,
            status: null,
            silentSOS: false,
            guardianMode: false,
            safeJourney: false,
            startedAt: null,
          },
        };
      }

      const sharedLocation = sharedLocationByUserId.get(guardianUser.id);
      const guardianSession = activeGuardianSessionByUserId.get(
        guardianUser.id
      );
      const safeJourney = activeJourneyByUserId.get(guardianUser.id);
      const emergencySession = activeEmergencyByUserId.get(
        guardianUser.id
      );

      const lastSeen =
        sharedLocation?.updatedAt ??
        guardianSession?.updatedAt ??
        safeJourney?.updatedAt ??
        emergencySession?.updatedAt ??
        null;

      const online =
        sharedLocation?.status === "ONLINE" &&
        isRecentlyOnline(sharedLocation.updatedAt);

      return {
        contactId: contact.id,
        userId: guardianUser.id,
        name: guardianUser.name || contact.name,
        phone: guardianUser.phone,
        email: contact.email,
        relation: contact.relation,
        isPrimary: contact.isPrimary,

        registered: true,
        online,

        latitude:
          sharedLocation?.latitude ??
          guardianSession?.latitude ??
          safeJourney?.latitude ??
          emergencySession?.latitude ??
          null,

        longitude:
          sharedLocation?.longitude ??
          guardianSession?.longitude ??
          safeJourney?.longitude ??
          emergencySession?.longitude ??
          null,

        accuracy: sharedLocation?.accuracy ?? null,

        batteryLevel:
          sharedLocation?.batteryLevel ??
          guardianSession?.batteryLevel ??
          emergencySession?.battery ??
          null,

        networkStatus:
          guardianSession?.networkStatus ??
          emergencySession?.network ??
          sharedLocation?.status ??
          "UNKNOWN",

        lastSeen: lastSeen?.toISOString() ?? null,

        guardianMode: {
          active: Boolean(guardianSession),
          status: guardianSession?.status ?? null,
          startedAt:
            guardianSession?.startedAt.toISOString() ?? null,
        },

        safeJourney: {
          active: Boolean(safeJourney),
          status: safeJourney?.status ?? null,
          destination: safeJourney?.destination ?? null,
          estimatedArrival:
            safeJourney?.estimatedArrival?.toISOString() ?? null,
          startedAt: safeJourney?.startedAt.toISOString() ?? null,
        },

        emergency: {
          active: Boolean(emergencySession),
          status: emergencySession?.status ?? null,
          silentSOS: emergencySession?.silentSOS ?? false,
          guardianMode: emergencySession?.guardianMode ?? false,
          safeJourney: emergencySession?.safeJourney ?? false,
          startedAt:
            emergencySession?.startedAt.toISOString() ?? null,
        },
      };
    });

    const onlineCount = guardians.filter(
      (guardian) => guardian.online
    ).length;

    return NextResponse.json({
      guardians,
      total: guardians.length,
      online: onlineCount,
    });
  } catch (error) {
    console.error("GET guardian network error:", error);

    return NextResponse.json(
      {
        error: "Unable to load the Guardian Network.",
      },
      {
        status: 500,
      }
    );
  }
}