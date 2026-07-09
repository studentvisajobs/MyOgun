import { prisma } from "@/lib/prisma";

export class TimelineService {
  static async add(
    sessionId: string,
    message: string,
    latitude?: number | null,
    longitude?: number | null
  ) {
    return prisma.guardianSessionTimeline.create({
      data: {
        sessionId,
        message,
        latitude,
        longitude,
      },
    });
  }

  static async latest(sessionId: string) {
    return prisma.guardianSessionTimeline.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });
  }
}