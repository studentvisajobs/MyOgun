import { prisma } from "@/lib/prisma";
import type { NotificationPayload } from "./NotificationTypes";
import { NotificationChannel } from "@/app/generated/prisma";


export class NotificationEngine {
  static async send(payload: NotificationPayload) {
    console.log("Notification:", payload);

    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        channel: payload.channel.toUpperCase() as NotificationChannel,
        incidentId: payload.incidentId,
        journeyId: payload.journeyId,
        emergencyId: payload.emergencyId,
      },
    });

    /**
     * Future integrations:
     * - Firebase Cloud Messaging
     * - Twilio SMS
     * - Email
     * - Push Notifications
     */
  }

  static guardian(
    title: string,
    message: string,
    journeyId?: string,
    userId?: string
  ) {
    return this.send({
      title,
      message,
      channel: "guardian",
      journeyId,
      userId,
    });
  }

  static police(
    title: string,
    message: string,
    incidentId?: string
  ) {
    return this.send({
      title,
      message,
      channel: "police",
      incidentId,
    });
  }

  static community(
    title: string,
    message: string,
    incidentId?: string
  ) {
    return this.send({
      title,
      message,
      channel: "community",
      incidentId,
    });
  }

  static emergency(
    title: string,
    message: string,
    emergencyId?: string,
    userId?: string
  ) {
    return this.send({
      title,
      message,
      channel: "emergency",
      emergencyId,
      userId,
    });
  }
}