
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  EmergencySessionService,
  EmergencySessionServiceError,
} from "@/lib/services/EmergencySessionService";

const VALID_MODES = [
  "GUARDIAN",
  "SILENT_SOS",
  "SAFE_JOURNEY",
] as const;

type EmergencyMode = (typeof VALID_MODES)[number];

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
        {
          success: false,
          error: "Login required.",
        },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const mode =
      typeof body.mode === "string"
        ? body.mode.trim().toUpperCase()
        : "";

    if (!VALID_MODES.includes(mode as EmergencyMode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid emergency mode.",
        },
        { status: 400 },
      );
    }

    const latitude = optionalNumber(body.latitude);
    const longitude = optionalNumber(body.longitude);

    const batteryLevel = optionalNumber(
      body.batteryLevel ?? body.battery,
    );

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
        {
          success: false,
          error: "Invalid GPS coordinates.",
        },
        { status: 400 },
      );
    }

    if (
      batteryLevel !== null &&
      (!Number.isFinite(batteryLevel) ||
        batteryLevel < 0 ||
        batteryLevel > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid battery level.",
        },
        { status: 400 },
      );
    }

    const session = await EmergencySessionService.start({
      userId: user.id,
      mode: mode as EmergencyMode,
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
    console.error("Emergency start error:", error);

    if (error instanceof EmergencySessionServiceError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start emergency session.",
      },
      { status: 500 },
    );
  }
}
