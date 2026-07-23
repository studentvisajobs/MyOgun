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

  static async createCommunityNotification(params: {
    userId: string;
    incidentId?: string;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        channel: "COMMUNITY",
        incidentId: params.incidentId,
      },
    });
  }

  static async createPoliceNotification(params: {
    userId: string;
    incidentId?: string;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        channel: "POLICE",
        incidentId: params.incidentId,
      },
    });
  }

  static async createEmergencyNotification(params: {
    userId: string;
    emergencyId?: string;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        channel: "EMERGENCY",
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

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.notification.delete({
      where: {
        id,
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