import { prisma } from "@/lib/prisma";
import { lockGuardianSessionUser } from "@/lib/services/GuardianSessionLock";
import { GuardianSessionService } from "@/lib/services/GuardianSessionService";

type EmergencyMode = "GUARDIAN" | "SILENT_SOS" | "SAFE_JOURNEY";

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
    return prisma.$transaction(async (tx) => {
      await lockGuardianSessionUser(tx, input.userId);

      const existing = await tx.emergencySession.findFirst({
        where: {
          userId: input.userId,
          status: {
            in: ["ACTIVE", "MONITORING", "RESPONDING"],
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      });

      if (existing) {
        throw new EmergencySessionServiceError(
          "An emergency session is already active.",
          409,
        );
      }

      const flags = modeFlags(input.mode);

      const guardianSession =
        input.mode === "SILENT_SOS"
          ? await GuardianSessionService.getOrCreateForSilentSOSTx(tx, {
              userId: input.userId,
              latitude: input.latitude,
              longitude: input.longitude,
              batteryLevel: input.batteryLevel,
              networkStatus: input.networkStatus,
            })
          : null;

      return tx.emergencySession.create({
        data: {
          userId: input.userId,
          status: "ACTIVE",
          guardianSessionId: guardianSession?.id ?? null,
          ownsGuardianSession: false,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          battery:
            input.batteryLevel === undefined || input.batteryLevel === null
              ? null
              : Math.max(0, Math.min(100, Math.round(input.batteryLevel))),
          network: input.networkStatus?.trim() || null,
          ...flags,

          timeline: {
            create: {
              title: `${input.mode} started`,
              description: "Emergency protection session started.",
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
    });
  }

  static async getActive(userId: string) {
    return prisma.emergencySession.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "MONITORING", "RESPONDING"],
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
    return prisma.$transaction(async (tx) => {
      await lockGuardianSessionUser(tx, input.userId);

      const session = await tx.emergencySession.findFirst({
        where: {
          id: input.sessionId,
          userId: input.userId,
          status: {
            in: ["ACTIVE", "MONITORING", "RESPONDING"],
          },
        },
        select: {
          id: true,
          guardianSessionId: true,
          silentSOS: true,
        },
      });

      if (!session) {
        throw new EmergencySessionServiceError(
          "Active emergency session not found.",
          404,
        );
      }

      const updatedSession = await tx.emergencySession.update({
        where: {
          id: session.id,
        },
        data: {
          latitude:
            input.latitude != null && Number.isFinite(input.latitude)
              ? input.latitude
              : undefined,

          longitude:
            input.longitude != null && Number.isFinite(input.longitude)
              ? input.longitude
              : undefined,

          battery:
            input.batteryLevel != null && Number.isFinite(input.batteryLevel)
              ? Math.max(0, Math.min(100, Math.round(input.batteryLevel)))
              : undefined,

          network: input.networkStatus?.trim() || undefined,

          timeline: {
            create: {
              title: input.message,
              description: input.message,
              latitude:
                input.latitude != null && Number.isFinite(input.latitude)
                  ? input.latitude
                  : null,

              longitude:
                input.longitude != null && Number.isFinite(input.longitude)
                  ? input.longitude
                  : null,
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
      if (session.silentSOS && session.guardianSessionId) {
        const latitude = input.latitude;
        const longitude = input.longitude;

        const guardianUpdate = await tx.guardianSession.updateMany({
          where: {
            id: session.guardianSessionId,
            userId: input.userId,
            status: "ACTIVE",
          },
          data: {
            latitude:
              latitude != null && Number.isFinite(latitude)
                ? latitude
                : undefined,
            longitude:
              longitude != null && Number.isFinite(longitude)
                ? longitude
                : undefined,
            batteryLevel:
              input.batteryLevel != null && Number.isFinite(input.batteryLevel)
                ? Math.max(0, Math.min(100, Math.round(input.batteryLevel)))
                : undefined,
            networkStatus: input.networkStatus?.trim() || undefined,
          },
        });
        if (
          guardianUpdate.count > 0 &&
          latitude != null &&
          longitude != null &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
        ) {
          await tx.guardianLocation.create({
            data: {
              sessionId: session.guardianSessionId,
              latitude,
              longitude,
            },
          });
        }
        if (guardianUpdate.count > 0) {
          await tx.guardianSessionTimeline.create({
            data: {
              sessionId: session.guardianSessionId,
              message: input.message,
              latitude:
                latitude != null && Number.isFinite(latitude) ? latitude : null,
              longitude:
                longitude != null && Number.isFinite(longitude)
                  ? longitude
                  : null,
            },
          });
        }
      }
      return updatedSession;
    });
  }

  static async stop(userId: string, sessionId: string) {
    return prisma.$transaction(async (tx) => {
      await lockGuardianSessionUser(tx, userId);

      const session = await tx.emergencySession.findFirst({
        where: {
          id: sessionId,
          userId,
          status: {
            in: ["ACTIVE", "MONITORING", "RESPONDING"],
          },
        },
        select: {
          id: true,
          guardianSessionId: true,
          silentSOS: true,
        },
      });

      if (!session) {
        throw new EmergencySessionServiceError(
          "Active emergency session not found.",
          404,
        );
      }

      const closedSession = await tx.emergencySession.update({
        where: { id: session.id },
        data: {
          status: "CLOSED",
          endedAt: new Date(),
          timeline: {
            create: {
              title: "Emergency session ended",
              description: "Emergency protection session stopped safely.",
            },
          },
        },
        include: {
          timeline: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (session.silentSOS && session.guardianSessionId) {
        const guardianSession = await tx.guardianSession.findFirst({
          where: {
            id: session.guardianSessionId,
            userId,
            status: "ACTIVE",
          },
          select: {
            id: true,
            guardianModeEnabled: true,
          },
        });

        if (guardianSession && !guardianSession.guardianModeEnabled) {
          const otherActiveEmergencies = await tx.emergencySession.count({
            where: {
              guardianSessionId: guardianSession.id,
              id: { not: session.id },
              silentSOS: true,
              status: {
                in: ["ACTIVE", "MONITORING", "RESPONDING"],
              },
            },
          });

          if (otherActiveEmergencies === 0) {
            await tx.guardianSession.update({
              where: { id: guardianSession.id },
              data: {
                status: "STOPPED",
                stoppedAt: new Date(),
                timeline: {
                  create: {
                    message:
                      "Silent SOS ended. Shared Guardian Session stopped safely.",
                  },
                },
              },
            });
          }
        }
      }

      return closedSession;
    });
  }
}
