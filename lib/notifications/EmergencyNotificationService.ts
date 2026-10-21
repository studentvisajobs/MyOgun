import { prisma } from "@/lib/prisma";
import { NotificationService as PushNotificationService } from "@/lib/notifications/NotificationService";

type EmergencyNotificationInput = {
  userId: string;
  emergencyId: string;
  title: string;
  message: string;
};

export class EmergencyNotificationService {
  /**
   * Create or reuse an emergency notification.
   */
  static async getOrCreate(input: EmergencyNotificationInput) {
    if (!input.userId.trim() || !input.emergencyId.trim()) {
      throw new Error("Recipient and emergency IDs are required.");
    }

    return prisma.notification.upsert({
      where: {
        userId_emergencyId_channel: {
          userId: input.userId,
          emergencyId: input.emergencyId,
          channel: "EMERGENCY",
        },
      },
      create: {
        userId: input.userId,
        emergencyId: input.emergencyId,
        channel: "EMERGENCY",
        title: input.title,
        message: input.message,
        pushStatus: "PENDING",
        pushAttempts: 0,
      },
      update: {},
    });
  }

  /**
   * Atomically claim a notification and return
   * the attempt number from the same database update.
   */
  static async claimForSending(notificationId: string) {
    const now = new Date();

    const notifications = await prisma.notification.updateManyAndReturn({
      where: {
        id: notificationId,
        OR: [
          {
            pushStatus: {
              in: ["PENDING", "FAILED"],
            },
          },
          {
            pushStatus: "SENDING",
            lastAttemptAt: {
              lt: new Date(now.getTime() - 5 * 60 * 1000),
            },
          },
        ],
        pushAttempts: {
          lt: 3,
        },
      },
      data: {
        pushStatus: "SENDING",
        pushAttempts: {
          increment: 1,
        },
        lastAttemptAt: now,
      },
      select: {
        pushAttempts: true,
      },
    });

    return notifications[0]?.pushAttempts ?? null;
  }

  /**
   * Record Firebase acceptance for the correct attempt.
   */
  static async markSent(notificationId: string, attemptNumber: number) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        pushStatus: "SENDING",
        pushAttempts: attemptNumber,
      },
      data: {
        pushStatus: "SENT",
        pushSentAt: new Date(),
      },
    });
  }

  /**
   * Record failure for the correct attempt.
   */
  static async markFailed(notificationId: string, attemptNumber: number) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        pushStatus: "SENDING",
        pushAttempts: attemptNumber,
      },
      data: {
        pushStatus: "FAILED",
      },
    });
  }

  /**
   * Send a tracked notification to one guardian.
   */
  /**
   * Send a tracked emergency notification to one guardian.
   */
  static async sendToGuardian(
    notificationId: string,
    guardianUserId: string,
    title: string,
    message: string,
  ) {
    const attemptNumber = await this.claimForSending(notificationId);

    if (attemptNumber === null) {
      return {
        attempted: false,
        accepted: false,
      };
    }

    try {
      const result = await PushNotificationService.notifyUser(
        guardianUserId,
        title,
        message,
      );

      if (result.successCount > 0) {
        await this.markSent(notificationId, attemptNumber);

        return {
          attempted: true,
          accepted: true,
          ...result,
        };
      }

      await this.markFailed(notificationId, attemptNumber);

      return {
        attempted: true,
        accepted: false,
        ...result,
      };
    } catch (error) {
      console.error("Tracked emergency push error:", error);

      try {
        await this.markFailed(notificationId, attemptNumber);
      } catch (statusError) {
        console.error("Failed to record emergency push status:", statusError);
      }

      return {
        attempted: true,
        accepted: false,
      };
    }
  }
}
