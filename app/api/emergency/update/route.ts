import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  EmergencySessionService,
  EmergencySessionServiceError,
} from "@/lib/services/EmergencySessionService";

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

    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId.trim()
        : "";

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required.",
        },
        { status: 400 }
      );
    }

    const message =
      typeof body.message === "string" &&
      body.message.trim()
        ? body.message.trim()
        : "Emergency session updated.";

    const session =
      await EmergencySessionService.update({
        userId: user.id,
        sessionId,
        message,

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
    console.error(
      "Emergency update error:",
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
          "Failed to update emergency session.",
      },
      { status: 500 }
    );
  }
}