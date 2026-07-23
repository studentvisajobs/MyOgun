import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  JourneyService,
  JourneyServiceError,
} from "@/lib/services/JourneyService";
import { NotificationService } from "@/lib/services/NotificationService";

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

    const journey = await JourneyService.start({
      userId: user.id,
      destination: String(body.destination || ""),
      startAddress:
        typeof body.startAddress === "string"
          ? body.startAddress
          : null,
      estimatedArrival:
        body.estimatedArrival || null,
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      accuracy:
        body.accuracy === undefined
          ? null
          : Number(body.accuracy),
      batteryLevel:
        body.batteryLevel === undefined
          ? null
          : Number(body.batteryLevel),
      networkStatus:
        typeof body.networkStatus === "string"
          ? body.networkStatus
          : null,
    });

    try {
      await NotificationService.createGuardianNotification({
        userId: user.id,
        journeyId: journey.id,
        title: "Journey Started",
        message: `Your Safe Journey to ${journey.destination} has started.`,
      });
    } catch (notificationError) {
      console.error(
        "Journey notification error:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        success: true,
        journey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Start journey error:", error);

    if (error instanceof JourneyServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to start journey." },
      { status: 500 }
    );
  }
}