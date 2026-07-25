import { prisma } from "@/lib/prisma";
import { detectArea } from "@/lib/ogunAreas";
import { LocationService } from "@/lib/services/LocationService";
import { CommunityNotificationService } from "@/lib/services/CommunityNotificationService";
import { ThreatScoreService } from "@/lib/services/ThreatScoreService";

export class IncidentServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "IncidentServiceError";
    this.status = status;
  }
}

type CreateIncidentInput = {
  userId?: string | null;
  title: string;
  description?: string | null;
  type: string;
  latitude: number;
  longitude: number;
  area?: string | null;
  localGovernment?: string | null;
  isAnonymous?: boolean;
  isCritical?: boolean;
};

type ConfirmationVote = "CONFIRM" | "FALSE_REPORT";

const VALID_INCIDENT_TYPES = new Set([
  "ROBBERY",
  "KIDNAPPING",
  "ACCIDENT",
  "FLOOD",
  "FIRE",
  "MISSING_PERSON",
  "SUSPICIOUS_ACTIVITY",
  "ROAD_BLOCK",
  "OTHER",
]);

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function validateCoordinates(
  latitude: number,
  longitude: number
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new IncidentServiceError(
      "Valid latitude and longitude are required.",
      400
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new IncidentServiceError(
      "Latitude must be between -90 and 90.",
      400
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new IncidentServiceError(
      "Longitude must be between -180 and 180.",
      400
    );
  }
}

function normalizeIncidentType(value: string) {
  const normalized = value.trim().toUpperCase();

  if (!VALID_INCIDENT_TYPES.has(normalized)) {
    throw new IncidentServiceError(
      "Invalid incident type.",
      400
    );
  }

  return normalized;
}

export class IncidentService {
  static async create(input: CreateIncidentInput) {
    const title = input.title.trim();

    if (!title) {
      throw new IncidentServiceError(
        "Incident title is required.",
        400
      );
    }

    validateCoordinates(
      input.latitude,
      input.longitude
    );

    const incidentType = normalizeIncidentType(
      input.type || "OTHER"
    );

    let validUserId: string | null = null;

    if (!input.isAnonymous && input.userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
        },
      });

      validUserId = user?.id ?? null;
    }

    const detectedArea = detectArea(
      input.latitude,
      input.longitude
    );

    const isCritical = Boolean(input.isCritical);

    const confidenceScore = isCritical ? 70 : 20;

    const threat = ThreatScoreService.calculate({
      type: incidentType,
      confidenceScore,
      confirmations: 0,
      evidenceCount: 0,
      isCritical,
    });

    const incident = await prisma.incident.create({
      data: {
        userId: input.isAnonymous
          ? null
          : validUserId,
        title,
        description: cleanOptionalText(
          input.description
        ),
        type: incidentType as never,
        latitude: input.latitude,
        longitude: input.longitude,
        area:
          cleanOptionalText(input.area) ||
          detectedArea.area ||
          null,
        localGovernment:
          cleanOptionalText(
            input.localGovernment
          ) ||
          detectedArea.localGovernment ||
          null,
        confidenceScore,
        threatScore: threat.score,
        threatLevel: threat.level as never,
        status: isCritical
          ? "CRITICAL"
          : "PENDING",
        isAnonymous: Boolean(input.isAnonymous),
      },
      include: {
        evidence: true,
        confirmations: true,
        user: true,
      },
    });

    try {
      await CommunityNotificationService.notifyNearbyUsers({
        reporterUserId: validUserId ?? "",
        incidentId: incident.id,
        latitude: incident.latitude,
        longitude: incident.longitude,
        title: incident.title,
        message: incident.type.replaceAll("_", " "),
      });
    } catch (notificationError) {
      console.error(
        "Community notification error:",
        notificationError
      );
    }

    return incident;
  }

  static async getAll() {
    return prisma.incident.findMany({
      include: {
        evidence: true,
        confirmations: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getLatest(limit = 20) {
    const safeLimit = Math.min(
      100,
      Math.max(1, Math.floor(limit))
    );

    return prisma.incident.findMany({
      take: safeLimit,
      include: {
        evidence: true,
        confirmations: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getById(id: string) {
    const incidentId = id.trim();

    if (!incidentId) {
      throw new IncidentServiceError(
        "Incident ID is required.",
        400
      );
    }

    return prisma.incident.findUnique({
      where: {
        id: incidentId,
      },
      include: {
        evidence: true,
        confirmations: true,
        updates: {
          orderBy: {
            createdAt: "desc",
          },
        },
        user: true,
      },
    });
  }

  static async getNearby(
    latitude: number,
    longitude: number,
    radiusMeters = 5000
  ) {
    validateCoordinates(latitude, longitude);

    if (
      !Number.isFinite(radiusMeters) ||
      radiusMeters <= 0
    ) {
      throw new IncidentServiceError(
        "Search radius must be greater than zero.",
        400
      );
    }

    const incidents =
      await prisma.incident.findMany({
        where: {
          status: {
            in: [
              "PENDING",
              "VERIFIED",
              "CRITICAL",
              "RESPONDING",
            ],
          },
        },
        include: {
          evidence: true,
          confirmations: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return incidents
      .map((incident) => ({
        ...incident,
        distance:
          LocationService.distanceInMeters(
            latitude,
            longitude,
            incident.latitude,
            incident.longitude
          ),
      }))
      .filter(
        (incident) =>
          incident.distance <= radiusMeters
      )
      .sort(
        (first, second) =>
          first.distance - second.distance
      );
  }

  static async calculateConfidence(
    incidentId: string
  ) {
    const incident =
      await prisma.incident.findUnique({
        where: {
          id: incidentId,
        },
        include: {
          evidence: true,
          confirmations: true,
        },
      });

    if (!incident) {
      throw new IncidentServiceError(
        "Incident not found.",
        404
      );
    }

    const confirmations =
      incident.confirmations.filter(
        (item) => item.vote === "CONFIRM"
      ).length;

    const falseReports =
      incident.confirmations.filter(
        (item) =>
          item.vote === "FALSE_REPORT"
      ).length;

    const evidenceCount =
      incident.evidence.length;

    let confidence =
      25 +
      confirmations * 15 +
      evidenceCount * 10 -
      falseReports * 20;

    confidence = Math.max(
      0,
      Math.min(100, confidence)
    );

    const status =
      confidence >= 90
        ? "CRITICAL"
        : confidence >= 70
          ? "VERIFIED"
          : "PENDING";

    const threat = ThreatScoreService.calculate({
      type: incident.type,
      confidenceScore: confidence,
      confirmations,
      evidenceCount,
      isCritical: status === "CRITICAL",
    });

    await prisma.incident.update({
      where: {
        id: incident.id,
      },
      data: {
        confidenceScore: confidence,
        threatScore: threat.score,
        threatLevel: threat.level as never,
        status,
      },
    });

    return {
      confidence,
      status,
      threatScore: threat.score,
      threatLevel: threat.level,
    };
  }

  static async confirm(
    incidentId: string,
    userId: string,
    vote: ConfirmationVote,
    comment?: string | null
  ) {
    const cleanIncidentId = incidentId.trim();
    const cleanUserId = userId.trim();
    const cleanComment = comment?.trim() || null;

    if (!cleanIncidentId) {
      throw new IncidentServiceError(
        "Incident ID is required.",
        400
      );
    }

    if (!cleanUserId) {
      throw new IncidentServiceError(
        "User ID is required.",
        400
      );
    }

    if (
      vote !== "CONFIRM" &&
      vote !== "FALSE_REPORT"
    ) {
      throw new IncidentServiceError(
        "Invalid vote.",
        400
      );
    }

    const incidentExists =
      await prisma.incident.findUnique({
        where: {
          id: cleanIncidentId,
        },
        select: {
          id: true,
        },
      });

    if (!incidentExists) {
      throw new IncidentServiceError(
        "Incident not found.",
        404
      );
    }

    const existingConfirmation =
      await prisma.confirmation.findFirst({
        where: {
          incidentId: cleanIncidentId,
          userId: cleanUserId,
        },
        select: {
          id: true,
        },
      });

    if (existingConfirmation) {
      await prisma.confirmation.update({
        where: {
          id: existingConfirmation.id,
        },
        data: {
          vote,
          comment: cleanComment,
        },
      });
    } else {
      await prisma.confirmation.create({
        data: {
          incidentId: cleanIncidentId,
          userId: cleanUserId,
          vote,
          comment: cleanComment,
        },
      });
    }

    await this.calculateConfidence(cleanIncidentId);

    const [incident, confirmations] =
      await Promise.all([
        prisma.incident.findUnique({
          where: {
            id: cleanIncidentId,
          },
          include: {
            evidence: true,
            confirmations: true,
            user: true,
          },
        }),

        prisma.confirmation.findMany({
          where: {
            incidentId: cleanIncidentId,
          },
          select: {
            vote: true,
          },
        }),
      ]);

    const confirmCount = confirmations.filter(
      (item) => item.vote === "CONFIRM"
    ).length;

    const falseReportCount =
      confirmations.filter(
        (item) =>
          item.vote === "FALSE_REPORT"
      ).length;

    return {
      incident,
      confirmCount,
      falseReportCount,
    };
  }

  static async changeStatus(
    incidentId: string,
    status: "RESPONDING" | "RESOLVED"
  ) {
    const cleanIncidentId = incidentId.trim();

    if (!cleanIncidentId) {
      throw new IncidentServiceError(
        "Incident ID is required.",
        400
      );
    }

    if (
      status !== "RESPONDING" &&
      status !== "RESOLVED"
    ) {
      throw new IncidentServiceError(
        "Invalid incident status.",
        400
      );
    }

    const incident =
      await prisma.incident.findUnique({
        where: {
          id: cleanIncidentId,
        },
        include: {
          evidence: true,
          confirmations: true,
        },
      });

    if (!incident) {
      throw new IncidentServiceError(
        "Incident not found.",
        404
      );
    }

    const confirmationCount =
      incident.confirmations.filter(
        (confirmation) =>
          confirmation.vote === "CONFIRM"
      ).length;

    const threat =
      status === "RESOLVED"
        ? {
            score: 0,
            level: "LOW" as const,
          }
        : ThreatScoreService.calculate({
            type: incident.type,
            confidenceScore:
              incident.confidenceScore,
            confirmations: confirmationCount,
            evidenceCount:
              incident.evidence.length,
            isCritical:
              incident.status === "CRITICAL",
          });

    return prisma.incident.update({
      where: {
        id: cleanIncidentId,
      },
      data: {
        status,
        threatScore: threat.score,
        threatLevel: threat.level as never,
        updates: {
          create: {
            message:
              status === "RESPONDING"
                ? "Emergency response has been assigned."
                : "Incident has been resolved.",
          },
        },
      },
      include: {
        evidence: true,
        confirmations: true,
        updates: {
          orderBy: {
            createdAt: "desc",
          },
        },
        user: true,
      },
    });
  }
}