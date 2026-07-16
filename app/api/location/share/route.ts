import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  LocationService,
  LocationServiceError,
} from "@/lib/services/LocationService";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const location = await LocationService.share({
      userId: user.id,
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      accuracy:
        body.accuracy === undefined ||
        body.accuracy === null
          ? null
          : Number(body.accuracy),
      batteryLevel:
        body.batteryLevel === undefined ||
        body.batteryLevel === null
          ? null
          : Number(body.batteryLevel),
      networkStatus:
        typeof body.networkStatus === "string"
          ? body.networkStatus
          : null,
    });

    return NextResponse.json({
      success: true,
      message: "Location shared successfully.",
      location,
    });
  } catch (error) {
    console.error("Share location error:", error);

    if (error instanceof LocationServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Unable to share location." },
      { status: 500 }
    );
  }
}