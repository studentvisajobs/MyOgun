import { prisma } from "@/lib/prisma";

export class GuardianSessionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "GuardianSessionError";
    this.status = status;
  }
}

type StartInput = {
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

type UpdateInput = {
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
  message?: string;
};

function toOptionalFiniteNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

function normalizeBatteryLevel(value?: number | null) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeNetworkStatus(value?: string | null) {
  if (!value?.trim()) {
    return "UNKNOWN";
  }

  return value.trim().toUpperCase();
}

export class GuardianSessionService {
  static async start(input: StartInput) {
    const existingSession =
      await prisma.guardianSession.findFirst({
        where: {
          userId: input.userId,
          status: "ACTIVE",
        },
        include: {
          locations: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
          timeline: {
            take: 20,
            orderBy: {
              createdAt: "desc",
            },
          },
          responders: true,
        },
      });

    if (existingSession) {
      return existingSession;
    }

    const latitude = toOptionalFiniteNumber(
      input.latitude
    );

    const longitude = toOptionalFiniteNumber(
      input.longitude
    );

    const batteryLevel = normalizeBatteryLevel(
      input.batteryLevel
    );

    const networkStatus = normalizeNetworkStatus(
      input.networkStatus
    );

    return prisma.guardianSession.create({
      data: {
        userId: input.userId,
        status: "ACTIVE",
        latitude,
        longitude,
        batteryLevel,
        networkStatus,

        locations:
          latitude !== null && longitude !== null
            ? {
                create: {
                  latitude,
                  longitude,
                },
              }
            : undefined,

        timeline: {
          create: {
            message: "Guardian Mode activated.",
            latitude,
            longitude,
          },
        },
      },
      include: {
        locations: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        timeline: {
          take: 20,
          orderBy: {
            createdAt: "desc",
          },
        },
        responders: true,
      },
    });
  }

  static async update(
    sessionId: string,
    data: UpdateInput
  ) {
    const cleanSessionId = sessionId.trim();

    if (!cleanSessionId) {
      throw new GuardianSessionError(
        "Session ID is required.",
        400
      );
    }

    const existingSession =
      await prisma.guardianSession.findUnique({
        where: {
          id: cleanSessionId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!existingSession) {
      throw new GuardianSessionError(
        "Guardian session not found.",
        404
      );
    }

    if (existingSession.status !== "ACTIVE") {
      throw new GuardianSessionError(
        "Guardian session is not active.",
        400
      );
    }

    const latitude = toOptionalFiniteNumber(
      data.latitude
    );

    const longitude = toOptionalFiniteNumber(
      data.longitude
    );

    const accuracy = toOptionalFiniteNumber(
      data.accuracy
    );

    const batteryLevel = normalizeBatteryLevel(
      data.batteryLevel
    );

    const networkStatus =
      data.networkStatus === undefined ||
      data.networkStatus === null
        ? undefined
        : normalizeNetworkStatus(
            data.networkStatus
          );

    const message =
      data.message?.trim() ||
      "Guardian location updated.";

    return prisma.guardianSession.update({
      where: {
        id: cleanSessionId,
      },
      data: {
        latitude:
          latitude === null
            ? undefined
            : latitude,

        longitude:
          longitude === null
            ? undefined
            : longitude,

        batteryLevel:
          data.batteryLevel === undefined ||
          data.batteryLevel === null
            ? undefined
            : batteryLevel,

        networkStatus,

        locations:
          latitude !== null &&
          longitude !== null
            ? {
                create: {
                  latitude,
                  longitude,
                  accuracy,
                },
              }
            : undefined,

        timeline: {
          create: {
            message,
            latitude,
            longitude,
          },
        },
      },
      include: {
        locations: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        timeline: {
          take: 20,
          orderBy: {
            createdAt: "desc",
          },
        },
        responders: true,
      },
    });
  }

  static async stop(sessionId: string) {
    const cleanSessionId = sessionId.trim();

    if (!cleanSessionId) {
      throw new GuardianSessionError(
        "Session ID is required.",
        400
      );
    }

    const existingSession =
      await prisma.guardianSession.findUnique({
        where: {
          id: cleanSessionId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!existingSession) {
      throw new GuardianSessionError(
        "Guardian session not found.",
        404
      );
    }

    if (existingSession.status !== "ACTIVE") {
      throw new GuardianSessionError(
        "Guardian session is not active.",
        400
      );
    }

    return prisma.guardianSession.update({
      where: {
        id: cleanSessionId,
      },
      data: {
        status: "STOPPED",
        stoppedAt: new Date(),
        timeline: {
          create: {
            message:
              "Guardian Mode stopped safely.",
          },
        },
      },
      include: {
        locations: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        timeline: {
          take: 20,
          orderBy: {
            createdAt: "desc",
          },
        },
        responders: true,
      },
    });
  }

  static async getActive(userId: string) {
    return prisma.guardianSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        responders: true,
        evidence: true,
        acknowledgements: true,
        locations: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        timeline: {
          take: 20,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  static async assignResponders(
    sessionId: string
  ) {
    const cleanSessionId = sessionId.trim();

    if (!cleanSessionId) {
      throw new GuardianSessionError(
        "Session ID is required.",
        400
      );
    }

    const session =
      await prisma.guardianSession.findUnique({
        where: {
          id: cleanSessionId,
        },
        include: {
          user: {
            include: {
              guardianContacts: true,
            },
          },
          responders: true,
        },
      });

    if (!session) {
      throw new GuardianSessionError(
        "Guardian session not found.",
        404
      );
    }

    if (!session.user) {
      throw new GuardianSessionError(
        "Guardian session has no linked user.",
        400
      );
    }

    const existingGuardianIds = new Set(
      session.responders
        .map(
          (responder) =>
            responder.guardianContactId
        )
        .filter(
          (
            guardianContactId
          ): guardianContactId is string =>
            Boolean(guardianContactId)
        )
    );

    const guardiansToAssign =
      session.user.guardianContacts.filter(
        (guardian) =>
          !existingGuardianIds.has(guardian.id)
      );

    if (guardiansToAssign.length > 0) {
      await prisma.emergencyResponder.createMany({
        data: guardiansToAssign.map(
          (guardian) => ({
            sessionId: cleanSessionId,
            guardianContactId: guardian.id,
            guardianName: guardian.name,
            guardianPhone: guardian.phone,
            status: "NOTIFIED",
          })
        ),
      });

      await prisma.guardianSessionTimeline.create({
        data: {
          sessionId: cleanSessionId,
          message: `${guardiansToAssign.length} guardian responder${
            guardiansToAssign.length === 1
              ? ""
              : "s"
          } notified.`,
          latitude: session.latitude,
          longitude: session.longitude,
        },
      });
    }

    return prisma.emergencyResponder.findMany({
      where: {
        sessionId: cleanSessionId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
  static async getTimeline(sessionId: string) {
  const cleanSessionId = sessionId.trim();

  if (!cleanSessionId) {
    throw new GuardianSessionError(
      "Session ID is required.",
      400
    );
  }

  return prisma.guardianSessionTimeline.findMany({
    where: {
      sessionId: cleanSessionId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
}