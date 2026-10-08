import { prisma } from "@/lib/prisma";
import { firebaseMessaging } from "@/lib/firebase/admin";

export type PushNotificationResult = {
  userCount: number;
  tokenCount: number;
  successCount: number;
  failureCount: number;
  usersWithoutTokens: number;
};

export class NotificationService {
  static async notifyUser(
    userId: string,
    title: string,
    message: string
  ) {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
    });

    if (tokens.length === 0) {
      return {
        userCount: 1,
        tokenCount: 0,
        successCount: 0,
        failureCount: 0,
        usersWithoutTokens: 1,
      };
    }

    const registrationTokens = tokens.map(
      (token) => token.token
    );

    const response =
      await firebaseMessaging.sendEachForMulticast({
        tokens: registrationTokens,
        notification: {
          title,
          body: message,
        },
        data: {
          clickAction: "/guardian",
        },
      });

    const invalidTokens: string[] = [];

    response.responses.forEach((result, index) => {
      if (result.success) return;

      console.error(
        "Push notification error:",
        result.error
      );

      const code = result.error?.code;

      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(registrationTokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({
        where: {
          token: { in: invalidTokens },
        },
      });
    }

    return {
      userCount: 1,
      tokenCount: registrationTokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      usersWithoutTokens: 0,
    };
  }

  static async notifyGuardians(
    guardianIds: string[],
    title: string,
    message: string
  ): Promise<PushNotificationResult> {
    const uniqueGuardianIds = Array.from(
      new Set(guardianIds)
    );

    const results = await Promise.all(
      uniqueGuardianIds.map((guardianId) =>
        this.notifyUser(guardianId, title, message)
      )
    );

    return results.reduce<PushNotificationResult>(
      (total, result) => ({
        userCount: total.userCount + result.userCount,
        tokenCount: total.tokenCount + result.tokenCount,
        successCount: total.successCount + result.successCount,
        failureCount: total.failureCount + result.failureCount,
        usersWithoutTokens:
          total.usersWithoutTokens + result.usersWithoutTokens,
      }),
      {
        userCount: 0,
        tokenCount: 0,
        successCount: 0,
        failureCount: 0,
        usersWithoutTokens: 0,
      }
    );
  }
}