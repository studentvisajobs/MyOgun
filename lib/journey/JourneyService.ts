import { prisma } from "@/lib/prisma";
import { NotificationEngine } from "@/lib/notifications/NotificationEngine";

type StartJourneyInput = {
  userId: string;
  destination: string;
  startAddress?: string | null;
  estimatedArrival?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
};

export class JourneyService {
  static async start(data: StartJourneyInput) {
    const journey = await prisma.safeJourney.create({
      data: {
        userId: data.userId,
        destination: data.destination,
        startAddress: data.startAddress,
        estimatedArrival: data.estimatedArrival,
        latitude: data.latitude,
        longitude: data.longitude,
        status: "ACTIVE",
        timeline: {
          create: {
            message: "Journey started",
            latitude: data.latitude,
            longitude: data.longitude,
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    await NotificationEngine.guardian(
      "Journey Started",
      `Journey to ${data.destination} has started.`,
      journey.id
    );

    return journey;
  }

  static async checkIn(journeyId: string) {
    const journey = await prisma.safeJourney.update({
      where: { id: journeyId },
      data: {
        status: "CHECKED_IN",
        timeline: {
          create: {
            message: "User checked in safely",
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    await NotificationEngine.guardian(
      "Journey Check-In",
      "User checked in safely.",
      journey.id
    );

    return journey;
  }

  static async finish(journeyId: string) {
    const journey = await prisma.safeJourney.update({
      where: { id: journeyId },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        timeline: {
          create: {
            message: "Journey completed",
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    await NotificationEngine.guardian(
      "Journey Completed",
      "Journey completed safely.",
      journey.id
    );

    return journey;
  }

  static async latest(userId: string) {
    return prisma.safeJourney.findFirst({
      where: {
        userId,
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }
}