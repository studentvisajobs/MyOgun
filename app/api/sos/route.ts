import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import { NotificationService as DatabaseNotificationService } from "@/lib/services/NotificationService";
import { NotificationService as PushNotificationService } from "@/lib/notifications/NotificationService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    const safeLatitude = Number.isFinite(latitude)
      ? latitude
      : null;

    const safeLongitude = Number.isFinite(longitude)
      ? longitude
      : null;

    const message =
      typeof body.message === "string" &&
      body.message.trim()
        ? body.message.trim()
        : "Emergency SOS Alert";

    const sos = await prisma.sOSAlert.create({
      data: {
        userId: user.id,
        latitude: safeLatitude,
        longitude: safeLongitude,
        message,
      },
    });

    try {
      await DatabaseNotificationService.createEmergencyNotification({
        userId: user.id,
        emergencyId: sos.id,
        title: "Emergency Activated",
        message:
          "Your SOS alert has been activated. Your guardians are being notified.",
      });
    } catch (notificationError) {
      console.error(
        "SOS database notification error:",
        notificationError
      );
    }

    const acceptedInvitations =
      await prisma.guardianInvitation.findMany({
        where: {
          senderId: user.id,
          status: "ACCEPTED",
          receiverId: {
            not: null,
          },
        },
        select: {
          receiverId: true,
        },
      });

    const guardianContacts =
      await prisma.guardianContact.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      });

    const contactPhones = guardianContacts.map(
      (contact) => contact.phone
    );

    const guardianUsersByPhone =
      contactPhones.length > 0
        ? await prisma.user.findMany({
            where: {
              phone: {
                in: contactPhones,
              },
            },
            select: {
              id: true,
            },
          })
        : [];

    const guardianUserIds = Array.from(
      new Set([
        ...acceptedInvitations
          .map(
            (invitation) =>
              invitation.receiverId
          )
          .filter(
            (
              receiverId
            ): receiverId is string =>
              Boolean(receiverId)
          ),

        ...guardianUsersByPhone.map(
          (guardian) => guardian.id
        ),
      ])
    );

    const locationText =
      safeLatitude !== null &&
      safeLongitude !== null
        ? `Location: ${safeLatitude.toFixed(
            5
          )}, ${safeLongitude.toFixed(5)}.`
        : "Location is currently unavailable.";

    try {
      if (guardianUserIds.length > 0) {
        await PushNotificationService.notifyGuardians(
          guardianUserIds,
          "🚨 SOS Emergency Alert",
          `${
            user.name || "A MyOgun user"
          } may be in danger. ${locationText} Open MyOgun immediately.`
        );
      }
    } catch (pushError) {
      console.error(
        "SOS guardian push error:",
        pushError
      );
    }

    return NextResponse.json({
      success: true,
      sos,
      guardiansMatched:
        guardianUserIds.length,
      contactsFound:
        guardianContacts.length,
    });
  } catch (error) {
    console.error("SOS error:", error);

    return NextResponse.json(
      {
        error:
          "Failed to activate the SOS alert.",
      },
      { status: 500 }
    );
  }
}