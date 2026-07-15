import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

function getPresence(updatedAt: Date | null) {
  if (!updatedAt) {
    return {
      online: false,
      presence: "OFFLINE" as const,
      sharingLocation: false,
    };
  }

  const ageMs = Date.now() - updatedAt.getTime();
  const ageMinutes = ageMs / 60000;

  if (ageMinutes <= 2) {
    return {
      online: true,
      presence: "ONLINE" as const,
      sharingLocation: true,
    };
  }

  if (ageMinutes <= 15) {
    return {
      online: false,
      presence: "RECENT" as const,
      sharingLocation: true,
    };
  }

  return {
    online: false,
    presence: "OFFLINE" as const,
    sharingLocation: false,
  };
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

    const contacts = await prisma.guardianContact.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    if (contacts.length === 0) {
      return NextResponse.json({
        success: true,
        guardians: [],
        summary: {
          total: 0,
          online: 0,
          recent: 0,
          offline: 0,
          travelling: 0,
          emergencies: 0,
        },
      });
    }

    const contactPhones = contacts.map((contact) => contact.phone);

    const registeredUsers = await prisma.user.findMany({
      where: {
        phone: {
          in: contactPhones,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        sharedLocations: {
          take: 1,
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            latitude: true,
            longitude: true,
            accuracy: true,
            batteryLevel: true,
            status: true,
            updatedAt: true,
          },
        },
        safeJourneys: {
          where: {
            status: {
              in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
            },
          },
          take: 1,
          orderBy: {
            startedAt: "desc",
          },
          select: {
            id: true,
            destination: true,
            estimatedArrival: true,
            latitude: true,
            longitude: true,
            status: true,
            startedAt: true,
          },
        },
        emergencySessions: {
          where: {
            status: {
              in: ["ACTIVE", "MONITORING", "RESPONDING"],
            },
          },
          take: 1,
          orderBy: {
            startedAt: "desc",
          },
          select: {
            id: true,
            status: true,
            latitude: true,
            longitude: true,
            startedAt: true,
            guardianMode: true,
            silentSOS: true,
            safeJourney: true,
          },
        },
      },
    });

    const usersByPhone = new Map(
      registeredUsers.map((user) => [
        normalizePhone(user.phone),
        user,
      ])
    );

    const guardians = contacts.map((contact) => {
      const registeredUser = usersByPhone.get(
        normalizePhone(contact.phone)
      );

      const location =
        registeredUser?.sharedLocations[0] ?? null;

      const activeJourney =
        registeredUser?.safeJourneys[0] ?? null;

      const activeEmergency =
        registeredUser?.emergencySessions[0] ?? null;

      const presence = getPresence(
        location?.updatedAt ?? null
      );

      return {
        id: contact.id,
        userId: registeredUser?.id ?? null,

        name: registeredUser?.name || contact.name,
        phone: contact.phone,
        email: contact.email,
        relation: contact.relation,
        isPrimary: contact.isPrimary,

        registered: Boolean(registeredUser),

        online: presence.online,
        presence: presence.presence,
        lastSeen: location?.updatedAt ?? null,
        sharingLocation: presence.sharingLocation,

        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy: location?.accuracy ?? null,

        batteryLevel: location?.batteryLevel ?? null,
        networkStatus: location?.status ?? "UNKNOWN",

        onJourney: Boolean(activeJourney),
        journey: activeJourney
          ? {
              id: activeJourney.id,
              destination: activeJourney.destination,
              estimatedArrival:
                activeJourney.estimatedArrival,
              latitude: activeJourney.latitude,
              longitude: activeJourney.longitude,
              status: activeJourney.status,
              startedAt: activeJourney.startedAt,
            }
          : null,

        inEmergency: Boolean(activeEmergency),
        emergency: activeEmergency
          ? {
              id: activeEmergency.id,
              status: activeEmergency.status,
              latitude: activeEmergency.latitude,
              longitude: activeEmergency.longitude,
              startedAt: activeEmergency.startedAt,
              guardianMode:
                activeEmergency.guardianMode,
              silentSOS: activeEmergency.silentSOS,
              safeJourney:
                activeEmergency.safeJourney,
            }
          : null,
      };
    });

    const summary = {
      total: guardians.length,
      online: guardians.filter(
        (guardian) => guardian.presence === "ONLINE"
      ).length,
      recent: guardians.filter(
        (guardian) => guardian.presence === "RECENT"
      ).length,
      offline: guardians.filter(
        (guardian) => guardian.presence === "OFFLINE"
      ).length,
      travelling: guardians.filter(
        (guardian) => guardian.onJourney
      ).length,
      emergencies: guardians.filter(
        (guardian) => guardian.inEmergency
      ).length,
    };

    return NextResponse.json(
      {
        success: true,
        guardians,
        summary,
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Guardian network GET error:", error);

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