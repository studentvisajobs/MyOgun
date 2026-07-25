import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/NotificationService";
import {
  calculateDistanceMetres,
  formatDistance,
} from "@/lib/utils/distance";

export class CommunityNotificationService {
  static async notifyNearbyUsers(params: {
    reporterUserId: string;
    incidentId: string;
    latitude: number;
    longitude: number;
    title: string;
    message: string;
    radiusMetres?: number;
  }) {
    const radius = params.radiusMetres ?? 1000;

    const locations =
      await prisma.sharedLocation.findMany();

    let notified = 0;

    for (const location of locations) {
      if (location.userId === params.reporterUserId) {
        continue;
      }

      const distance =
        calculateDistanceMetres(
          {
            latitude: params.latitude,
            longitude: params.longitude,
          },
          {
            latitude: location.latitude,
            longitude: location.longitude,
          }
        );

      if (distance > radius) {
        continue;
      }

      await NotificationService.createCommunityNotification({
        userId: location.userId,
        incidentId: params.incidentId,
        title: params.title,
        message: `${params.message} (${formatDistance(
          distance
        )} away)`,
      });

      notified++;
    }

    return {
      radius,
      notified,
    };
  }
}