import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

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

    const latitude =
        body.latitude == null ? null : Number(body.latitude);

      const longitude =
        body.longitude == null ? null : Number(body.longitude);

      const batteryInput = body.batteryLevel ?? body.battery;
      const batteryLevel =
        batteryInput == null ? null : Number(batteryInput);

      if (
        (latitude !== null &&
          (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude !== null &&
          (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) ||
        (batteryLevel !== null &&
          (!Number.isInteger(batteryLevel) ||
            batteryLevel < 0 ||
            batteryLevel > 100))
      ) {
        return NextResponse.json(
          { error: "Invalid location or battery information." },
          { status: 400 }
        );
      }

    const session = await GuardianSessionService.start({
      userId: user.id,
      latitude,
      longitude,
      batteryLevel,
      networkStatus:
        typeof body.networkStatus === "string"
          ? body.networkStatus
          : typeof body.network === "string"
            ? body.network
            : null,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Guardian start error:", error);

    if (error instanceof GuardianSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to start Guardian Mode." },
      { status: 500 }
    );
  }
}