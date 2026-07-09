import { prisma } from "@/lib/prisma";

export class JourneyTracker {
  static async update(
    journeyId: string,
    latitude: number,
    longitude: number
  ) {
    return prisma.safeJourneyTimeline.create({
      data: {
        journeyId,
        message: "GPS Updated",
        latitude,
        longitude,
      },
    });
  }
}