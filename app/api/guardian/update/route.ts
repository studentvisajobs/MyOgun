import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  EmergencySessionService,
  EmergencySessionServiceError,
} from "@/lib/services/EmergencySessionService";

function optionalNumber(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return NaN;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId.trim()
        : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const latitude = optionalNumber(body.latitude);
    const longitude = optionalNumber(body.longitude);
    const accuracy = optionalNumber(body.accuracy);
    const batteryLevel = optionalNumber(body.batteryLevel);

    if (
      (latitude !== null &&
        (!Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180))
    ) {
      return NextResponse.json(
        { error: "Invalid GPS coordinates." },
        { status: 400 }
      );
    }

    if (
      accuracy !== null &&
      (!Number.isFinite(accuracy) || accuracy < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid GPS accuracy." },
        { status: 400 }
      );
    }

    if (
      batteryLevel !== null &&
      (!Number.isInteger(batteryLevel) ||
        batteryLevel < 0 ||
        batteryLevel > 100)
    ) {
      return NextResponse.json(
        { error: "Invalid battery level." },
        { status: 400 }
      );
    }

    const session = await EmergencySessionService.update({
      userId: user.id,
      sessionId,
      message:
        typeof body.message === "string" && body.message.trim()
          ? body.message.trim()
          : "Emergency location updated.",
      latitude,
      longitude,
      batteryLevel,
      networkStatus:
        typeof body.networkStatus === "string"
          ? body.networkStatus
          : null,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    if (error instanceof EmergencySessionServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Emergency update error:", error);

    return NextResponse.json(
      { error: "Failed to update emergency session." },
      { status: 500 }
    );
  }
}