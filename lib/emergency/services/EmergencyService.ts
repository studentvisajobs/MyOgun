import { prisma } from "@/lib/prisma";

import { GuardianService } from "./GuardianService";
import { TimelineService } from "./TimelineService";
import { NotificationService } from "./NotificationService";

type StartOptions = {
  userId: string;

  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;

  batteryLevel?: number | null;
  networkStatus?: string | null;

  mode: string;
};

export class EmergencyService {
  static async start(options: StartOptions) {
    const session = await prisma.guardianSession.create({
      data: {
        userId: options.userId,

        latitude: options.latitude,
        longitude: options.longitude,

        batteryLevel: options.batteryLevel,
        networkStatus: options.networkStatus,

        status: "ACTIVE",
      },
    });

    await TimelineService.add(
      session.id,
      `${options.mode} session started.`,
      options.latitude,
      options.longitude
    );

    await GuardianService.createResponders(
      session.id,
      options.userId
    );

    await NotificationService.notifyGuardians(session.id);

    return session;
  }

  static async stop(sessionId: string) {
    return prisma.guardianSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: "STOPPED",
      },
    });
  }
}