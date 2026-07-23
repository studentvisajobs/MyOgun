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

    const journeyId =
      typeof body.journeyId === "string"
        ? body.journeyId.trim()
        : "";

    const minutes =
      typeof body.minutes === "number"
        ? body.minutes
        : Number(body.minutes);

    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(minutes)) {
      return NextResponse.json(
        {
          error:
            "Extension duration is required.",
        },
        { status: 400 }
      );
    }

    const journey =
      await JourneyService.extend({
        userId: user.id,
        journeyId,
        minutes,
      });

    try {
      await NotificationService.createGuardianNotification({
        userId: user.id,
        journeyId: journey.id,
        title: "Journey Extended",
        message: `Your Safe Journey has been extended by ${minutes} minutes.`,
      });
    } catch (notificationError) {
      console.error(
        "Journey extension notification error:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      journey,
    });
  } catch (error) {
    console.error(
      "Extend journey error:",
      error
    );

    if (
      error instanceof JourneyServiceError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to extend journey.",
      },
      { status: 500 }
    );
  }
}