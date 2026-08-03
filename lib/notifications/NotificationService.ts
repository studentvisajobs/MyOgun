import { prisma } from "@/lib/prisma";
import { firebaseMessaging } from "@/lib/firebase/admin";

export class NotificationService {
  static async notifyUser(
    userId: string,
    title: string,
    message: string
  ) {
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
      },
    });

    if (tokens.length === 0) {
      return;
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

    response.responses.forEach(
      (result, index) => {
        if (!result.success) {
          invalidTokens.push(
            registrationTokens[index]
          );

          console.error(
            "Push notification error:",
            result.error
          );
        }
      }
    );

    if (invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({
        where: {
          token: {
            in: invalidTokens,
          },
        },
      });
    }
  }

  static async notifyGuardians(
    guardianIds: string[],
    title: string,
    message: string
  ) {
    await Promise.all(
      guardianIds.map((guardianId) =>
        this.notifyUser(
          guardianId,
          title,
          message
        )
      )
    );
  }
}