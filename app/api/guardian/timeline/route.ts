import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  GuardianSessionError,
  GuardianSessionService,
} from "@/lib/services/GuardianSessionService";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } = new URL(req.url);

    const sessionId =
      searchParams.get("sessionId")?.trim() ?? "";

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const activeSession =
      await GuardianSessionService.getActive(
        user.id
      );

    if (
      !activeSession ||
      activeSession.id !== sessionId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Active Guardian session not found.",
        },
        {
          status: 404,
        }
      );
    }

    const timeline =
      await GuardianSessionService.getTimeline(
        sessionId
      );

    return NextResponse.json({
      success: true,
      timeline,
    });
  } catch (error) {
    if (
      error instanceof GuardianSessionError
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    console.error(
      "Get guardian timeline error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve the emergency timeline.",
      },
      {
        status: 500,
      }
    );
  }
}