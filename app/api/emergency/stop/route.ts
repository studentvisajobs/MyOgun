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

    const session =
      await EmergencySessionService.stop(
        user.id,
        sessionId
      );

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "Emergency stop error:",
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
          "Failed to stop emergency session.",
      },
      { status: 500 }
    );
  }
}