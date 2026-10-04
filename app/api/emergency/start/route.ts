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

type EmergencyMode =
  (typeof VALID_MODES)[number];

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Login required.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const mode =
      typeof body.mode === "string"
        ? body.mode.trim().toUpperCase()
        : "";

    if (
      !VALID_MODES.includes(
        mode as EmergencyMode
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid emergency mode.",
        },
        { status: 400 }
      );
    }

    const session =
      await EmergencySessionService.start({
        userId: user.id,
        mode: mode as EmergencyMode,

        latitude:
          body.latitude === undefined ||
          body.latitude === null
            ? null
            : Number(body.latitude),

        longitude:
          body.longitude === undefined ||
          body.longitude === null
            ? null
            : Number(body.longitude),

        batteryLevel:
          body.batteryLevel === undefined ||
          body.batteryLevel === null
            ? body.battery === undefined ||
              body.battery === null
              ? null
              : Number(body.battery)
            : Number(body.batteryLevel),

        networkStatus:
          typeof body.networkStatus ===
          "string"
            ? body.networkStatus
            : typeof body.network ===
                "string"
              ? body.network
              : null,
      });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Emergency start error:",
      error
    );

    if (
      error instanceof
      EmergencySessionServiceError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to start emergency session.",
      },
      { status: 500 }
    );
  }
}