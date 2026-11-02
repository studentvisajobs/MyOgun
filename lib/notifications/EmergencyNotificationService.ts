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
   * Create or reuse a tracked Safe Journey notification.
   * One notification per guardian per journey.
   */
  static async getOrCreateJourneyNotification(input: {
    guardianUserId: string;
    journeyId: string;
    escalationCycleId: string;
    title: string;
    message: string;
        }) {
            if (
            !input.guardianUserId.trim() ||
            !input.journeyId.trim()
            ) {
            throw new Error(
                "Guardian and journey IDs are required."
            );
            }

            if (!input.escalationCycleId.trim()) {
        throw new Error("Escalation cycle ID is required.");
        }

        const emergencyId =
        `journey:${input.journeyId}:${input.escalationCycleId}`;

    return prisma.notification.upsert({
      where: {
        userId_emergencyId_channel: {
          userId: input.guardianUserId,
          emergencyId,
          channel: "EMERGENCY",
        },
      },
      create: {
        userId: input.guardianUserId,
        journeyId: input.journeyId,
        emergencyId,
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
 * Cancel Safe Journey notifications that have not
 * been confirmed as sent, including in-progress attempts.
 */

  static async cancelJourneyNotifications(journeyId: string) {
    if (!journeyId.trim()) {
      throw new Error("Journey ID is required.");
    }

    return prisma.notification.updateMany({
        where: {
        journeyId,
        OR: [
            {
            emergencyId: `journey:${journeyId}`,
            },
            {
            emergencyId: {
                startsWith: `journey:${journeyId}:`,
            },
            },
        ],
        channel: "EMERGENCY",
        pushStatus: {
        in: ["PENDING", "FAILED", "SENDING"],
        },
        },
      data: {
        pushStatus: "CANCELLED",
      },
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
            pushStatus: "PENDING",
        },
        {
            pushStatus: "FAILED",
            lastAttemptAt: {
            lt: new Date(now.getTime() - 60 * 1000),
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
 * Permanently cancel a claimed notification.
 * Prevents stale Safe Journey alerts from being retried.
 */
static async markCancelled(
  notificationId: string,
  attemptNumber: number,
) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      pushStatus: "SENDING",
      pushAttempts: attemptNumber,
    },
    data: {
      pushStatus: "CANCELLED",
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
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      journeyId: true,
      emergencyId: true,
    },
  });

  if (!notification) {
    await this.markFailed(notificationId, attemptNumber);

    return {
      attempted: false,
      accepted: false,
    };
  }

  if (
    notification.journeyId &&
    notification.emergencyId?.startsWith(
    `journey:${notification.journeyId}:`
    )
  ) {
    const journey = await prisma.safeJourney.findFirst({
      where: {
        id: notification.journeyId,
        status: "OVERDUE",
        escalatedAt: { not: null },
      },
      select: {
        escalatedAt: true,
      },
    });

    const expectedEmergencyId = journey?.escalatedAt
      ? `journey:${notification.journeyId}:${journey.escalatedAt.toISOString()}`
      : null;

    if (notification.emergencyId !== expectedEmergencyId) {
    await this.markCancelled(notificationId, attemptNumber);

    return {
        attempted: false,
        accepted: false,
    };
    }
  }

    // Check whether this notification was cancelled
    // while its journey status was being verified.
    if (notification.journeyId) {
    const activeNotification = await prisma.notification.findFirst({
        where: {
        id: notificationId,
        pushStatus: "SENDING",
        pushAttempts: attemptNumber,
        },
        select: {
        id: true,
        },
    });

    if (!activeNotification) {
        return {
        attempted: false,
        accepted: false,
        };
    }
    }

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
