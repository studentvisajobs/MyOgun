import { prisma } from "@/lib/prisma";

type StartInput = {
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  battery?: number | null;
  network?: string | null;
};

export class EmergencySessionService {
  static async startGuardianMode(data: StartInput) {
    return prisma.emergencySession.create({
      data: {
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        battery: data.battery,
        network: data.network,
        guardianMode: true,
        status: "ACTIVE",
        timeline: {
          create: {
            title: "Guardian Mode Activated",
            description: "User started Guardian Mode.",
            latitude: data.latitude,
            longitude: data.longitude,
          },
        },
      },
      include: {
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async updateLocation(
    sessionId: string,
    latitude: number,
    longitude: number
  ) {
    return prisma.emergencyTimeline.create({
      data: {
        emergencyId: sessionId,
        title: "Location Updated",
        description: "Guardian Mode location updated.",
        latitude,
        longitude,
      },
    });
  }

  static async stop(sessionId: string) {
    return prisma.emergencySession.update({
      where: { id: sessionId },
      data: {
        status: "SAFE",
        endedAt: new Date(),
        timeline: {
          create: {
            title: "Guardian Mode Ended",
            description: "User ended Guardian Mode safely.",
          },
        },
      },
      include: {
        timeline: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}