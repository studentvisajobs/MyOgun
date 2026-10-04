import { prisma } from "@/lib/prisma";

type EmergencyMode =
  | "GUARDIAN"
  | "SILENT_SOS"
  | "SAFE_JOURNEY";

type StartEmergencyInput = {
  userId: string;
  mode: EmergencyMode;
  latitude?: number | null;
  longitude?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

type UpdateEmergencyInput = {
  userId: string;
  sessionId: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

export class EmergencySessionServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EmergencySessionServiceError";
    this.status = status;
  }
}

function modeFlags(mode: EmergencyMode) {
  return {
    guardianMode: mode === "GUARDIAN",
    silentSOS: mode === "SILENT_SOS",
    safeJourney: mode === "SAFE_JOURNEY",
  };
}

export class EmergencySessionService {
  static async start(input: StartEmergencyInput) {
    const existing =
      await prisma.emergencySession.findFirst({
        where: {
          userId: input.userId,
          status: {
            in: [
              "ACTIVE",
              "MONITORING",
              "RESPONDING",
            ],
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      });

    if (existing) {
      throw new EmergencySessionServiceError(
        "An emergency session is already active.",
        409
      );
    }

    const flags = modeFlags(input.mode);

    return prisma.emergencySession.create({
      data: {
        userId: input.userId,
        status: "ACTIVE",
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        battery:
          input.batteryLevel === undefined ||
          input.batteryLevel === null
            ? null
            : Math.max(
                0,
                Math.min(
                  100,
                  Math.round(input.batteryLevel)
                )
              ),
        network:
          input.networkStatus?.trim() || null,
        ...flags,

        timeline: {
          create: {
            title: `${input.mode} started`,
            description:
              "Emergency protection session started.",
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
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
  }

  static async getActive(userId: string) {
    return prisma.emergencySession.findFirst({
      where: {
        userId,
        status: {
          in: [
            "ACTIVE",
            "MONITORING",
            "RESPONDING",
          ],
        },
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

  static async update(input: UpdateEmergencyInput) {
    const session =
      await prisma.emergencySession.findFirst({
        where: {
          id: input.sessionId,
          userId: input.userId,
          status: {
            in: [
              "ACTIVE",
              "MONITORING",
              "RESPONDING",
            ],
          },
        },
        select: {
          id: true,
        },
      });

    if (!session) {
      throw new EmergencySessionServiceError(
        "Active emergency session not found.",
        404
      );
    }

    return prisma.emergencySession.update({
      where: {
        id: session.id,
      },
      data: {
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,

        battery:
          input.batteryLevel === undefined ||
          input.batteryLevel === null
            ? undefined
            : Math.max(
                0,
                Math.min(
                  100,
                  Math.round(input.batteryLevel)
                )
              ),

        network:
          input.networkStatus?.trim() || undefined,

        timeline: {
          create: {
            title: input.message,
            description: input.message,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
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
  }

  static async stop(
    userId: string,
    sessionId: string
  ) {
    const session =
      await prisma.emergencySession.findFirst({
        where: {
          id: sessionId,
          userId,
          status: {
            in: [
              "ACTIVE",
              "MONITORING",
              "RESPONDING",
            ],
          },
        },
        select: {
          id: true,
        },
      });

    if (!session) {
      throw new EmergencySessionServiceError(
        "Active emergency session not found.",
        404
      );
    }

    return prisma.emergencySession.update({
      where: {
        id: session.id,
      },
      data: {
        status: "CLOSED",
        endedAt: new Date(),

        timeline: {
          create: {
            title: "Emergency session ended",
            description:
              "Emergency protection session stopped safely.",
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
  }
}
