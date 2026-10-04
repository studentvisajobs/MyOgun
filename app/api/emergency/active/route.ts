import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  EmergencySessionService,
  EmergencySessionServiceError,
} from "@/lib/services/EmergencySessionService";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const session =
      await EmergencySessionService.getActive(
        user.id
      );

    return NextResponse.json({
      success: true,
      session: session ?? null,
    });
  } catch (error) {
    console.error(
      "Get active emergency session error:",
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
          "Unable to retrieve the active emergency session.",
      },
      { status: 500 }
    );
  }
}