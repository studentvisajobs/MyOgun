import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  JourneyService,
  JourneyServiceError,
} from "@/lib/services/JourneyService";

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

    const journey = await JourneyService.update({
      userId: user.id,
      journeyId: String(body.journeyId || ""),
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

    return NextResponse.json({
      success: true,
      journey,
    });
  } catch (error) {
    console.error("Journey update error:", error);

    if (error instanceof JourneyServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Unable to update journey." },
      { status: 500 }
    );
  }
}