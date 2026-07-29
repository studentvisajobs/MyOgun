import { prisma } from "@/lib/prisma";

type DeviceLocationInput = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  batteryLevel?: number | null;
  networkStatus?: string | null;
};

type StartJourneyInput = DeviceLocationInput & {
  userId: string;
  destination: string;
  startAddress?: string | null;
  estimatedArrival?: string | Date | null;
};

type UpdateJourneyInput = DeviceLocationInput & {
  userId: string;
  journeyId: string;
};

type JourneyActionInput = {
  userId: string;
  journeyId: string;
};

type ExtendJourneyInput = JourneyActionInput & {
  minutes: number;
};

export class JourneyServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "JourneyServiceError";
    this.status = status;
  }
}

function validateCoordinates(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new JourneyServiceError(
      "Valid latitude and longitude are required.",
      400
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new JourneyServiceError(
      "Latitude must be between -90 and 90.",
      400
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new JourneyServiceError(
      "Longitude must be between -180 and 180.",
      400
    );
  }
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

function normalizeAccuracy(value?: number | null) {
  if (value === undefined || value === null) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

function normalizeNetworkStatus(value?: string | null) {
  if (!value?.trim()) {
    return "ONLINE";
  }

  return value.trim().toUpperCase();
}

export class JourneyService {
  static async start(input: StartJourneyInput) {
    const destination = input.destination.trim();

    if (!destination) {
      throw new JourneyServiceError(
        "Destination is required.",
        400
      );
    
    }

    validateCoordinates(
      input.latitude,
      input.longitude
    );

    let estimatedArrival: Date | null = null;

    if (input.estimatedArrival) {
      estimatedArrival = new Date(
        input.estimatedArrival
      );

      if (Number.isNaN(estimatedArrival.getTime())) {
        throw new JourneyServiceError(
          "Estimated arrival time is invalid.",
          400
        );
      }

      if (estimatedArrival.getTime() <= Date.now()) {
        throw new JourneyServiceError(
          "Estimated arrival must be in the future.",
          400
        );
      }
    }

    const existingJourney =
      await prisma.safeJourney.findFirst({
        where: {
          userId: input.userId,
          status: {
            in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
          },
        },
        select: {
          id: true,
        },
      });

    if (existingJourney) {
      throw new JourneyServiceError(
        "You already have an active Safe Journey. End it before starting another.",
        409
      );
    }

    const accuracy = normalizeAccuracy(
      input.accuracy
    );

    const batteryLevel = normalizeBatteryLevel(
      input.batteryLevel
    );

    const networkStatus = normalizeNetworkStatus(
      input.networkStatus
    );

    return prisma.$transaction(async (tx) => {
      const journey = await tx.safeJourney.create({
        data: {
          userId: input.userId,
          destination,
          startAddress:
            input.startAddress?.trim() || null,
          estimatedArrival,
          latitude: input.latitude,
          longitude: input.longitude,
          status: "ACTIVE",
          timeline: {
          create: {
            message: "Safe Journey started.",
            latitude: input.latitude,
            longitude: input.longitude,
          },
        },
        locations: {
          create: {
            latitude: input.latitude,
            longitude: input.longitude,
            accuracy,
          },
        },
        },
        include: {
          timeline: {
            orderBy: {
              createdAt: "desc",
            },
          },

          locations: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      await tx.sharedLocation.upsert({
        where: {
          userId: input.userId,
        },
        update: {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy,
          batteryLevel,
          status: networkStatus,
        },
        create: {
          userId: input.userId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy,
          batteryLevel,
          status: networkStatus,
        },
      });

      return journey;
    });
  }

  static async update(input: UpdateJourneyInput) {
    if (!input.journeyId.trim()) {
      throw new JourneyServiceError(
        "Journey ID is required.",
        400
      );
    }

    validateCoordinates(
      input.latitude,
      input.longitude
    );

    const journey = await prisma.safeJourney.findFirst({
      where: {
        id: input.journeyId,
        userId: input.userId,
        status: {
          in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
        },
      },
      select: {
        id: true,
      },
    });

    if (!journey) {
      throw new JourneyServiceError(
        "Active journey not found.",
        404
      );
    }

    const accuracy = normalizeAccuracy(
      input.accuracy
    );

    const batteryLevel = normalizeBatteryLevel(
      input.batteryLevel
    );

    const networkStatus = normalizeNetworkStatus(
      input.networkStatus
    );

    return prisma.$transaction(async (tx) => {
      const updatedJourney =
        await tx.safeJourney.update({
          where: {
            id: input.journeyId,
          },
          data: {
            latitude: input.latitude,
            longitude: input.longitude,

            locations: {
              create: {
                latitude: input.latitude,
                longitude: input.longitude,
                accuracy,
              },
            },
          },
          include: {
            timeline: {
              orderBy: {
                createdAt: "desc",
              },
            },

            locations: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      await tx.sharedLocation.upsert({
        where: {
          userId: input.userId,
        },
        update: {
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy,
          batteryLevel,
          status: networkStatus,
        },
        create: {
          userId: input.userId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy,
          batteryLevel,
          status: networkStatus,
        },
      });

      return updatedJourney;
    });
  }

  static async checkIn(input: JourneyActionInput) {
    const journey =
      await prisma.safeJourney.findFirst({
        where: {
          id: input.journeyId,
          userId: input.userId,
          status: {
            in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
          },
        },
        select: {
          id: true,
        },
      });

    if (!journey) {
      throw new JourneyServiceError(
        "Active journey not found.",
        404
      );
    }

    return prisma.safeJourney.update({
      where: {
        id: journey.id,
      },
      data: {
        status: "CHECKED_IN",
        timeline: {
          create: {
            message: "User checked in safely.",
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

  static async stop(input: JourneyActionInput) {
    const journey =
      await prisma.safeJourney.findFirst({
        where: {
          id: input.journeyId,
          userId: input.userId,
          status: {
            in: ["ACTIVE", "CHECKED_IN", "OVERDUE"],
          },
        },
        select: {
          id: true,
        },
      });

    if (!journey) {
      throw new JourneyServiceError(
        "Active journey not found.",
        404
      );
    }

    return prisma.safeJourney.update({
      where: {
        id: journey.id,
      },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        timeline: {
          create: {
            message: "Safe Journey completed.",
          },
        },
      },
      include: {
        timeline: {
          orderBy: {
            createdAt: "desc",
          },
        },
        locations: {
        orderBy: {
          createdAt: "asc",
        },
      },
      },
    });
  }

  static async extend(
    input: ExtendJourneyInput
  ) {
    const allowedMinutes = [15, 30, 60];

    if (!allowedMinutes.includes(input.minutes)) {
      throw new JourneyServiceError(
        "Extension must be 15, 30, or 60 minutes.",
        400
      );
    }

    const journey =
      await prisma.safeJourney.findFirst({
        where: {
          id: input.journeyId,
          userId: input.userId,
          status: "OVERDUE",
        },
        select: {
          id: true,
        },
      });

    if (!journey) {
      throw new JourneyServiceError(
        "Overdue journey not found.",
        404
      );
    }

    const estimatedArrival = new Date(
      Date.now() + input.minutes * 60_000
    );

    return prisma.safeJourney.update({
      where: {
        id: journey.id,
      },
      data: {
        status: "ACTIVE",
        estimatedArrival,
        timeline: {
          create: {
            message: `Journey extended by ${input.minutes} minutes.`,
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
    const journey =
      await prisma.safeJourney.findFirst({
        where: {
          userId,
          status: {
            in: [
              "ACTIVE",
              "CHECKED_IN",
              "OVERDUE",
            ],
          },
        },
        include: {
          timeline: {
            orderBy: {
              createdAt: "desc",
            },
          },
          locations: {
          orderBy: {
            createdAt: "asc",
          },
        },
        },
      });

    if (
      !journey ||
      journey.status !== "ACTIVE" ||
      !journey.estimatedArrival ||
      journey.estimatedArrival.getTime() >
        Date.now()
    ) {
      return journey;
    }

    return prisma.safeJourney.update({
      where: {
        id: journey.id,
      },
      data: {
        status: "OVERDUE",
        timeline: {
          create: {
            message:
              "Estimated arrival time passed. Journey marked as overdue.",
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