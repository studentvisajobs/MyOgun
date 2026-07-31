import { prisma } from "@/lib/prisma";

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

    console.log(
      `Sending "${title}" to ${tokens.length} devices`
    );

    // Firebase logic will go here later
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