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

function toOptionalFiniteNumber(
  value?: number | null
) {
  if (value === undefined || value === null) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

function normalizeBatteryLevel(
  value?: number | null
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
}

function normalizeNetworkStatus(
  value?: string | null
) {
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

    const networkStatus =
      normalizeNetworkStatus(
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
          latitude !== null &&
          longitude !== null
            ? {
                create: {
                  latitude,
                  longitude,
                },
              }
            : undefined,

        timeline: {
          create: {
            message:
              "Guardian Mode activated.",
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

    if (
      existingSession.status !== "ACTIVE"
    ) {
      throw new GuardianSessionError(
        "Guardian session is not active.",
        400
      );
    }

    const latitude = toOptionalFiniteNumber(
      data.latitude
    );

    const longitude =
      toOptionalFiniteNumber(data.longitude);

    const accuracy = toOptionalFiniteNumber(
      data.accuracy
    );

    const batteryLevel =
      normalizeBatteryLevel(
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

    if (
      existingSession.status !== "ACTIVE"
    ) {
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

    if (session.status !== "ACTIVE") {
      throw new GuardianSessionError(
        "Guardian session is not active.",
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
          !existingGuardianIds.has(
            guardian.id
          )
      );

    if (guardiansToAssign.length > 0) {
      await prisma.emergencyResponder.createMany(
        {
          data: guardiansToAssign.map(
            (guardian) => ({
              sessionId: cleanSessionId,
              guardianContactId:
                guardian.id,
              guardianName: guardian.name,
              guardianPhone:
                guardian.phone,
              status: "NOTIFIED",
            })
          ),
        }
      );

      await prisma.guardianSessionTimeline.create(
        {
          data: {
            sessionId: cleanSessionId,
            message: `${
              guardiansToAssign.length
            } guardian responder${
              guardiansToAssign.length === 1
                ? ""
                : "s"
            } notified.`,
            latitude: session.latitude,
            longitude: session.longitude,
          },
        }
      );
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

static async respond(
  sessionId: string,
  userId: string
) {
  const cleanSessionId = sessionId.trim();

  if (!cleanSessionId) {
    throw new GuardianSessionError(
      "Session ID is required.",
      400
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      phone: true,
    },
  });

  if (!user) {
    throw new GuardianSessionError(
      "User not found.",
      404
    );
  }

  const session =
    await prisma.guardianSession.findUnique({
      where: {
        id: cleanSessionId,
      },
      select: {
        id: true,
        status: true,
        latitude: true,
        longitude: true,
      },
    });

  if (!session) {
    throw new GuardianSessionError(
      "Guardian session not found.",
      404
    );
  }

  if (session.status !== "ACTIVE") {
    throw new GuardianSessionError(
      "Guardian session is not active.",
      400
    );
  }

  const responder =
    await prisma.emergencyResponder.findFirst({
      where: {
        sessionId: cleanSessionId,
        guardianPhone: user.phone,
      },
    });

  if (!responder) {
    throw new GuardianSessionError(
      "You are not assigned as a responder for this session.",
      403
    );
  }

  if (
    responder.status === "RESPONDING" ||
    responder.status === "ARRIVED" ||
    responder.status === "COMPLETED"
  ) {
    return responder;
  }

  const respondingAt = new Date();

  const updatedResponder =
    await prisma.emergencyResponder.update({
      where: {
        id: responder.id,
      },
      data: {
        status: "RESPONDING",
        viewedAt:
          responder.viewedAt ?? respondingAt,
        respondingAt,
      },
    });

  await prisma.guardianSessionTimeline.create({
    data: {
      sessionId: cleanSessionId,
      message: `${updatedResponder.guardianName} is responding.`,
      latitude: session.latitude,
      longitude: session.longitude,
    },
  });

  return updatedResponder;
}

  static async arrive(
    sessionId: string,
    userId: string
  ) {
    const cleanSessionId = sessionId.trim();

    if (!cleanSessionId) {
      throw new GuardianSessionError(
        "Session ID is required.",
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        phone: true,
      },
    });

    if (!user) {
      throw new GuardianSessionError(
        "User not found.",
        404
      );
    }

    if (!user.phone) {
      throw new GuardianSessionError(
        "Your account does not have a phone number.",
        400
      );
    }

    const session =
      await prisma.guardianSession.findUnique({
        where: {
          id: cleanSessionId,
        },
        select: {
          id: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      });

    if (!session) {
      throw new GuardianSessionError(
        "Guardian session not found.",
        404
      );
    }

    if (session.status !== "ACTIVE") {
      throw new GuardianSessionError(
        "Guardian session is not active.",
        400
      );
    }

    const responder =
      await prisma.emergencyResponder.findFirst({
        where: {
          sessionId: cleanSessionId,
          guardianPhone: user.phone,
        },
      });

    if (!responder) {
      throw new GuardianSessionError(
        "You are not assigned as a responder for this session.",
        403
      );
    }

    if (
      responder.status === "ARRIVED" ||
      responder.status === "COMPLETED"
    ) {
      return responder;
    }

    if (responder.status !== "RESPONDING") {
      throw new GuardianSessionError(
        "You must confirm that you are responding before marking yourself as arrived.",
        400
      );
    }

    const arrivedAt = new Date();

    const updatedResponder =
      await prisma.emergencyResponder.update({
        where: {
          id: responder.id,
        },
        data: {
          status: "ARRIVED",
          viewedAt:
            responder.viewedAt ?? arrivedAt,
          respondingAt:
            responder.respondingAt ?? arrivedAt,
          arrivedAt,
        },
      });

    await prisma.guardianSessionTimeline.create({
      data: {
        sessionId: cleanSessionId,
        message: `${updatedResponder.guardianName} has arrived at the emergency location.`,
        latitude: session.latitude,
        longitude: session.longitude,
      },
    });

    return updatedResponder;
  }


  static async getDashboard(
    sessionId: string,
    userId?: string
  ) {
    const cleanSessionId = sessionId.trim();

    if (!cleanSessionId) {
      throw new GuardianSessionError(
        "Session ID is required.",
        400
      );
    }

    const session =
      await prisma.guardianSession.findFirst({
        where: {
          id: cleanSessionId,
          ...(userId
            ? {
                userId,
              }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },

          locations: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },

          timeline: {
            take: 100,
            orderBy: {
              createdAt: "desc",
            },
          },

          responders: {
            orderBy: {
              createdAt: "asc",
            },
          },

          evidence: {
            orderBy: {
              createdAt: "desc",
            },
          },

          acknowledgements: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!session) {
      throw new GuardianSessionError(
        "Guardian session not found.",
        404
      );
    }

    const [latestLocation] =
      session.locations;

    return {
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        stoppedAt: session.stoppedAt,
        latitude: session.latitude,
        longitude: session.longitude,
        batteryLevel:
          session.batteryLevel,
        networkStatus:
          session.networkStatus,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        user: session.user,
      },

      latestLocation:
        latestLocation ?? null,

      timeline: session.timeline,

      responders: session.responders,

      evidence: session.evidence,

      acknowledgements:
        session.acknowledgements,

      summary: {
        responderCount:
          session.responders.length,

        evidenceCount:
          session.evidence.length,

        acknowledgementCount:
          session.acknowledgements.length,

        hasLocation:
          Boolean(latestLocation) ||
          (session.latitude !== null &&
            session.longitude !== null),

        isActive:
          session.status === "ACTIVE",
      },
    };
  }


  static async getLocation(
    sessionId: string,
    userId: string
  ) {
    const cleanSessionId = sessionId.trim();

    if (!cleanSessionId) {
      throw new GuardianSessionError(
        "Session ID is required.",
        400
      );
    }

    const session =
      await prisma.guardianSession.findFirst({
        where: {
          id: cleanSessionId,
          userId,
        },
        select: {
          id: true,
          status: true,
          latitude: true,
          longitude: true,
          batteryLevel: true,
          networkStatus: true,
          startedAt: true,
          stoppedAt: true,
          updatedAt: true,

          locations: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              latitude: true,
              longitude: true,
              accuracy: true,
              createdAt: true,
            },
          },
        },
      });

    if (!session) {
      throw new GuardianSessionError(
        "Guardian session not found.",
        404
      );
    }

    const latestLocation =
      session.locations[0] ?? null;

    return {
      sessionId: session.id,
      status: session.status,
      isActive: session.status === "ACTIVE",

      latitude:
        latestLocation?.latitude ??
        session.latitude,

      longitude:
        latestLocation?.longitude ??
        session.longitude,

      accuracy:
        latestLocation?.accuracy ?? null,

      batteryLevel:
        session.batteryLevel,

      networkStatus:
        session.networkStatus,

      locationUpdatedAt:
        latestLocation?.createdAt ??
        session.updatedAt,

      startedAt: session.startedAt,
      stoppedAt: session.stoppedAt,
    };
  }

}