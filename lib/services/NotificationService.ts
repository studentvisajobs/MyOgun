import { prisma } from "@/lib/prisma";

export class NotificationService {
  static async createGuardianNotification(params: {
    userId: string;
    journeyId?: string;
    emergencyId?: string;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        channel: "GUARDIAN",
        journeyId: params.journeyId,
        emergencyId: params.emergencyId,
      },
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }

  static async getForUser(userId: string) {
    return prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async unreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}