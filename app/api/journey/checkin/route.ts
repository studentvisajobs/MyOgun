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

    const journey = await JourneyService.checkIn({
      userId: user.id,
      journeyId: String(body.journeyId || ""),
    });

    try {
      await NotificationService.createGuardianNotification({
        userId: user.id,
        journeyId: journey.id,
        title: "Journey Check-in",
        message: "You checked in successfully during your Safe Journey.",
      });
    } catch (notificationError) {
      console.error(
        "Journey check-in notification error:",
        notificationError
      );
    }

    return NextResponse.json({
      success: true,
      journey,
    });
  } catch (error) {
    console.error("Journey check-in error:", error);

    if (error instanceof JourneyServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to check in." },
      { status: 500 }
    );
  }
}