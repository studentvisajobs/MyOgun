import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const incidentId = String(body.incidentId || "");
    const level = String(body.level || "");
    const distance = Number(body.distance);

    if (!incidentId) {
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    if (!["danger", "critical"].includes(level)) {
      return NextResponse.json({
        success: true,
        notified: false,
      });
    }

    const incident = await prisma.incident.findUnique({
      where: {
        id: incidentId,
      },
      select: {
        id: true,
        title: true,
        area: true,
        localGovernment: true,
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found." },
        { status: 404 }
      );
    }

    const location =
      incident.area ||
      incident.localGovernment ||
      "your current location";

    const distanceText =
      distance < 1000
        ? `${Math.round(distance)}m`
        : `${(distance / 1000).toFixed(1)}km`;

    const title =
      level === "critical"
        ? "🚨 DANGER VERY CLOSE"
        : "⚠️ Nearby Danger";

    const message =
      level === "critical"
        ? `${incident.title} reported approximately ${distanceText} away near ${location}. Take care immediately.`
        : `${incident.title} reported approximately ${distanceText} away near ${location}. Stay alert.`;

    await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        channel: "EMERGENCY",
      },
    });

    try {
      await PushNotificationService.notifyUser(
        user.id,
        title,
        message
      );
    } catch (pushError) {
      console.error(
        "Nearby danger push error:",
        pushError
      );
    }

    return NextResponse.json({
      success: true,
      notified: true,
    });
  } catch (error) {
    console.error(
      "Nearby danger notification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to send nearby danger notification.",
      },
      { status: 500 }
    );
  }
}